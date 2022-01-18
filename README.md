# stealthdrop
## Anonymous Airdrops using ZK proofs

stealthdrop.xyz is an airdrop utility that allows anyone to create ERC20 token airdrops on Ethereum that can be claimed by completely anonymous accounts.

# Demo

[INSERT VIDEO]

### User flow:

- Connect the "public" wallet that is eligible for the airdrop.
- Sign a message proving your ownership of the "public" wallet.
- Switch to another (anonymous) account and claim your airdrop without linking your original account in any way.

# Why?

To motivate this construction, we look at how airdrops currently work: Usually, protocols will set up airdrops that distribute a limited supply of ERC20 tokens to their team, early contributors, users and other people involved in the success of the protocol. While the underlying goal of such airdrops is to create a medium for governance for future decisions ([DeGov](https://vitalik.ca/general/2021/08/16/voting3.html) for DeFi), the limited supply creates interesting game theoretic conditions: FOMO and the promise of power establishes a "market value" for the cost of governance, and many end up trading their tokens at high valuations. The science behind this mechanism has been a hot topic of study right at the intersection of microeconomics and behavioral economics, and even has a name these days: [tokenomics](https://coinmarketcap.com/alexandria/article/what-is-tokenomics).

Focusing on the DeGov enabled by these tokens, one fatal flaw in current token systems is the muddling between identity and governance. If everyone knows `vitalik.eth` voted "NO" for a protocol proposal, how does that influence the opinion of the rest of the community? Does everyone still fairly and independently consider the impact of the proposal?

<img width="629" alt="image" src="https://user-images.githubusercontent.com/6984346/149878638-18c79ac2-a8fd-4122-9f00-a069ab76f108.png">
caption "snapshot labs shares everyone's votes publicly"

On the other end of the spectrum, when someone with a public identity deviates from the norm and casts a vote others in the community don't like, they end up exposing themselves to harassment on Twitter and other social media.

<img width="431" alt="image" src="https://user-images.githubusercontent.com/6984346/149878894-678988f2-f453-41de-b07d-a75ab6dc88b2.png">

caption "Everyone knows your vote"

<img width="606" alt="image" src="https://user-images.githubusercontent.com/6984346/149879079-d917b615-eba7-4fff-9809-de05d274250e.png">

caption "Everyone knows if you sell your token"


While it's arguable if such accountability is actually a positive attribute of these token systems, we think it's important to explore the alternative.

With this vision, we present stealthdrop: a form of airdrop that let's users claim their airdrops completely anonymously. We enable truly anonymous governance by effectively letting completely virgin wallets claim an airdrop on behalf of other wallets. Nobody even knows if the original wallet claimed their airdrop or not.

# How?

The mechanism for making this possible is quite complex and has lots of subtle details, so let's start with an overview:

![Untitled-2022-01-13-2340-2](https://user-images.githubusercontent.com/6984346/149846632-4fdcd983-3e9b-4f9e-9a24-99c5f95a81fb.png)



Now, let's break down each step:

## Merkle tree

Much like regular airdrops, stealthdrop starts with an airdropper creating a merkle tree of addresses eligible for the airdrop. The merkle tree acts as a simple vector commitment scheme, allowing the airdropper to commit a long list of vectors by just publishing the root hash on-chain. Any claimer can then prove the existence of their address in the tree by opening a merkle path proof in just O(log n) elements (where n is the length of the list of addresses).

## Zero-knowledge proof

This is where things get most interesting. Here's an exact spec of what the proof proves:

1. Given an ECDSA signature, does it originate from a particular public key?
2. Does the public key corresponding to the signature belong to the merkle tree?
3. Is the hash of the signature a non-malleable one way function's output from the input signature? (This is the hash used to prevent double-claiming)

![Untitled-2022-01-13-2340-3](https://user-images.githubusercontent.com/6984346/149868761-f569c4a5-6ff7-4c6b-882e-2029d958dc92.png)

Next we'll talk about how each part works and what design choices you may have made at each step.

### ECDSA Signature Verification

While this is certainly the most complex part of the circuits, we actually had no role in creating it! Just recently, a [team from 0xPARC's learning group worked on making signature verification inside a ZK-SNARK possible](https://github.com/0xPARC/circom-secp256k1). These circuits are extremely beautiful! There's a lot of clever tricks going on to minimise the total number of constraints. Even so, this circuit is a bit of a behemoth: it takes 400k constraints to derive a public key from a private key and 9.6 million(!) constraints to verify a signature.

For our application, we could have used the private -> public key derivation instead, saving ~9 million constraints, but we decided to use the signature verification circuit since it's impossible to obtain a private key from a wallet interface like MetaMask or WalletConnect. Perhaps, one day, wallets will allow for running ZK-SNARKs inside the wallet itself.

### Merkle Tree construction

The circuit itself is rather straightforward. Checking a merkle path proof is just a matter of traversing the path and hashing children at each step. However, one design choice you might consider is the value at the leaves of the tree. We were thinking about ideas that might allow us to hide the list of addresses we airdrop to, but unfortunately couldn't come up with anything practical. It seemed like a non-trivial problem since any counterparty trying to deanonymise the list essentially has infinite time (since the Merkle Tree itself needs to be publicly stored to generate path proofs) and the search space of addresses in use is finite. The _simple_ centralised solution to this might be to store the tree itself in a central server and only reveal path proofs by making addresses provide a valid signature, but that's just not quite satisfying. We'd be curious to hear if you have ideas to do this in a decentralised setting.

### Nullifier hash construction

[todo]

One interesting tidbit to note here, particular to our application, is the non-malleability of ECDSA signatures: Given a message and a keypair, the generated signature is actually not unique. For any signature (R, S), (R, N-S) is also a valid signature (where N is the order of the secp256k1 group). Since stealthdrop generates nullifiers using signatures, this malleability would be a pretty big problem. To fix this, we only allow for signatures that have an S value lower than 1/2 prime order.

## On-chain contract

# Who?

We (@divide-by-0, @nibnalin and @adhyyan) built out this project over the course of a week during Hack Lodge. The original idea of this construction came from @gubsheep and the 0xparc community.

The journey we shared in writing this project was long and windy(to say the least).

We started by installing Circom 2, the shiny new ZK-SNARK compiler, only to discover that apparently it was just straight-up [broken](https://github.com/iden3/snarkjs/issues/107)! Witness calculation would just crash when you tried to generate a proof. In fact, it had been broken for nearly 3 months and had probably impacted countless others trying to compile circuits.

We took it upon ourselves to fix this. What followed was a day or two of debugging the Circom compiler, snarkjs and all of their dependencies. With a lot of help from @phated, we went from handwriting binary files to figure out what's broken (0/10 would not recommend) to writing out 3 PRs across circom/snarkjs that fix [all](https://github.com/iden3/circom_runtime/pull/16) [the](https://github.com/iden3/circom_runtime/pull/14) [issues](https://github.com/iden3/snarkjs/pull/121)! As a side effect, one of the PRs also reduces the snarkjs bundle size by a significant fraction, making for faster load times for in-browser proof verification.

Finally having resolved all these issues, we got back to our own circuits. After numerous off-by-one bugs and other unexpected hitches (did you know that the MIMC hash function Tornado Cash uses is not the same as the one used by Dark Forest?), we finally had a working circuit. But, so far, we were omitting signature verification. You see, signature verification is quite a spectacle: It's 9.6million constraints! Even compiling the proving key for the circuit requires 40GB RAM!

So we got a beefy 3.7ghZ, 128GB RAM dedicated server and started working with it. Interestingly enough, it turned out to be non-trivial to get the scripts to use the full capabilities of our beefy server. Despite setting node's `max-old-space-size` flag, we would reach around 7GB usage and the script would crash complaining about memory allocations. Yi Sun (one of the creators of the ecdsa circuit) pointed us to a rather obscure trick: https://stackoverflow.com/questions/38558989/node-js-heap-out-of-memory/59923848#59923848 that resolved our issues. Incidentally, that StackOverflow answer is authored by jbaylina, one of the core contributors to snarkjs/circom. I can only imagine he was trying to do something similar to us. 🧐

While we were wading through the weeds generating the proving key on one end, Adhyyan had been working on setting up the frontend, figuring out how to get all the information we need from browser wallets (uncompressed public key, signature pieces, wallet switching, etc.) and figuring out how to set up a remote SNARK prover capable of handling our 9.7million constraint circuit. While the UI we had at the time was _questionable_ at best, the implementation of the remote SNARK prover is actually quite cool: Unlike other nodejs task queue systems like kue or bull (link), this implementation does not rely on any external dependencies like redis, it only spawns native processes and manages them in a queue cleanly. (add more adhyyan?)

With each of these individual pieces: the circuits, the remote SNARK prover and the frontend working reasonably, we entered integration hell. We encountered some of the most interesting bugs as we tried to put all these pieces together:

1. It turns out the "canonical" signature format is the opposite between `libsecp256k1` and `openssl`, one of them uses s values less than 1/2 prime order, and the other one uses s values more than 1/2 prime order.
2. When you make a request you can set your CORS mode to `no-cors` (accidentally) and any response you get will just not be visible to your code \-\_\-
3. The only way to ask a wallet for your public key is to ask for a signature instead and run `ecrecover` on this signature. I have no idea why it's not just part of the standard API.

Despite all these bumps, we finally did get to a working implementation a few hours before demos! It was a really fun experience hacking on something like this with a large group of people working on their own, equally impressive projects around us at HackLodge! Here's some bloopers from our own project:

<img width="132" alt="Screenshot 2022-01-17 at 3 47 09 PM" src="https://user-images.githubusercontent.com/6984346/149874381-de66e8ec-594d-42e8-9f99-34b61f28a855.png">
caption "no plan is complete without a good nap 😴"

![image](https://user-images.githubusercontent.com/6984346/149874407-aee0a9aa-cd8f-4220-a4b3-bc8731be8556.png)
caption "2AM commits do be like that sometimes"




The ECDSA construction was implemented by members of the 0xparc community and open-sourced just a few weeks ago: https://github.com/0xPARC/circom-secp256k1.

The Merkle Tree construction and other primitives were strongly inspired by the Tornado Cash protocol and its code: https://github.com/tornadocash.
