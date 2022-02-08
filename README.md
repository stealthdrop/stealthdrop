# stealthdrop

## Anonymous Airdrops using ZK proofs

[stealthdrop.xyz](https://stealthdrop.xyz) is an airdrop utility that enables ERC20 token airdrops that can be claimed by completely anonymous accounts.

# Demo

[INSERT VIDEO]

### User flow:

- Connect the "public" wallet that is eligible for the airdrop.
- Sign a message proving your ownership of the "public" wallet.
- Switch to another (anonymous) account and claim your airdrop without linking your original account in any way.

You can play around with the demo yourself on [stealthdrop.xyz](https://stealthdrop.xyz) on the xDai chain! If you've played [DarkForest](https://zkga.me) with an address that's linked to any Twitter account (or contributed to the community at [ETHUni](https://www.ethuniversity.org)/[HackLodge](https://hacklodge.org)), you can claim the token yourself! What you do with these tokens is up to you, but understand that we only intend for this token to be a proof of concept for what's possible. None of our code is audited or recommended for production use without serious considerations.

In this post, we'll dive into the motivation behind making StealthDrop and explain the inner workings of the application.

# Why?

To motivate this construction, let's look at how airdrops currently work: Usually, protocols will set up airdrops that distribute a limited supply of ERC20 tokens to their team, early contributors, users and others involved in the success of the protocol. While often, the underlying goal of such airdrops is to create a medium for governance for future decisions ([DeGov](https://vitalik.ca/general/2021/08/16/voting3.html) for DeFi), the limited supply creates interesting game-theoretic conditions: FOMO and the promise of power establishes a "market value" for the cost of governance, and many end up trading their tokens at high valuations. The science behind coin voting mechanisms have been a hot topic of study right at the intersection of microeconomics and behavioural economics, and even has a name these days: [tokenomics](https://coinmarketcap.com/alexandria/article/what-is-tokenomics).

Focusing on the DeGov enabled by these tokens, one fatal flaw in current token systems is the muddling between identity and governance. If everyone knows `vitalik.eth` voted "No" for a protocol proposal, how does that influence the opinion of the rest of the community? Does everyone still consider the impact of the proposal fairly and independently? 

<p>
<img width="400" alt="image" src="https://user-images.githubusercontent.com/6984346/149878638-18c79ac2-a8fd-4122-9f00-a069ab76f108.png">

<em>Snapshot Labs shares everyone's votes publicly</em>

</p>

On the other end of the spectrum, when someone with a public identity deviates from the norm and casts a vote others in the community don't like, they end up exposing themselves to harassment on Twitter and other social media.

<p>
<img width="431" alt="image" src="https://user-images.githubusercontent.com/6984346/149878894-678988f2-f453-41de-b07d-a75ab6dc88b2.png">

<em>Everyone knows your vote</em>

</p>
<p>
<img width="593" alt="image" src="https://user-images.githubusercontent.com/6984346/152887131-3a2d2b3b-3903-42d5-8ea7-97d760e39867.png">
  
<em>Everyone knows if you sell your token</em>

</p>

Even if votes are hidden under [MACI](https://github.com/appliedzkp/maci), knowing whether Vitalik voted on the proposal could change how much thought people put into their own vote. While it's arguable if such accountability is actually a positive attribute of these token systems, we think it's important to explore the alternative. In fact, real-world elections don't enforce such peer pressure (beyond the occasional dinner party debates), likely for a good reason.

With this vision, we present StealthDrop: an airdrop that lets addresses claim their airdrops completely anonymously. We enable truly anonymous governance by effectively letting completely virgin wallets claim an airdrop on behalf of other wallets. Nobody even knows if the original wallet has claimed their airdrop or not.

# How?

The mechanism for making this possible is quite complex and has lots of subtle details, so let's start with an overview:

![Untitled-2022-01-13-2340-2](https://user-images.githubusercontent.com/6984346/149846632-4fdcd983-3e9b-4f9e-9a24-99c5f95a81fb.png)

Now, let's peel layers off this diagram step by step:

## Merkle tree

Much like regular airdrops, StealthDrop starts with an airdropper creating a Merkle tree of addresses eligible for the airdrop. The Merkle tree acts as a vector commitment scheme, allowing the airdropper to commit a long list of addresses by just publishing the Merkle tree's root hash on-chain. Any claimer can then prove the existence of their address in the tree by opening a Merkle path proof in just O(log n) elements (where n is the length of the list).

## Zero-knowledge proof

This is where things get more interesting. Here's an exact spec of what the zk-SNARK proves:

1. Given an ECDSA signature, does it originate from a particular public key?
2. Does the public key corresponding to the signature belong to the Merkle tree?
3. Is the hash of the signature a non-malleable one-way function's output from the input signature? (This is the hash used to prevent double-claiming, more on this to follow)

![Untitled-2022-01-13-2340-3](https://user-images.githubusercontent.com/6984346/149868761-f569c4a5-6ff7-4c6b-882e-2029d958dc92.png)

Peeling another layer, next we'll talk about how each part works and the design choices involved at each step.

### ECDSA Signature Verification

While this is certainly the most complex part of the circuits, we actually had no role in creating it! Just recently, a [team from 0xPARC's learning group worked on making ECDSA inside a ZK-SNARK possible](https://github.com/0xPARC/circom-secp256k1). These circuits are extremely beautiful! There are lots of clever tricks going on to minimise the total number of constraints, many of which they've written about in their blog post [here](https://0xparc.org/blog/zk-ecdsa-1). Even so, this circuit is a behemoth: it takes 400k constraints just to derive a public key from a private key and 9.6 million(!) constraints to verify a signature.

For our application, we originally considered using the private -> public key derivation instead (as that would save our application \~9 million constraints) but we decided to use the signature verification circuit since current API specs make it nearly impossible to obtain a private key from a wallet interface like MetaMask or WalletConnect (for good reason, of course). Perhaps, one day, wallets will allow for running ZK-SNARKs _inside_ the wallet itself.<sup>coming soon from a 0xPARC ZKID Working Group team<a href="https://twitter.com/MetaMask/status/1483488847866458115?s=20&t=5k5itqBx4uQUhHyC1iqMaQ">👀</a></sup>

### Merkle Tree Path Proofs

This component of the circuits is rather straightforward. Checking a Merkle path proof is just a matter of traversing the path and hashing a node's children at each step. However, one design choice worth considering in this construction is the values at the leaves of the tree: the list of addresses eligible for the airdrop. Whether it is practically possible to make this list private as well is an open question. It seems like a very non-trivial problem since any counterparty trying to deanonymise the list essentially has infinite time (since the Merkle Tree and its leaves need to be publicly stored to generate path proofs) and the search space of addresses is finite. The _simple_ centralised solution to this might be to store the tree itself in a central server and only reveal path proofs by making addresses provide a valid signature, but that's not the most satisfying. [Claim codes](https://twitter.com/nicksdjohnson/status/1476060092218761219?s=20&t=kz4NU_WovAHvROX5cCsGaA) are another similar approach that trade-off centralisation for the privacy of the list.

### Nullifier Hash Construction

Next, we need a method to make sure no address in the Merkle Tree can claim the airdrop multiple times. To do so, we need to uniquely identify each address in the list of airdropees. Let's call this unique identifier the "nullifier hash" (for reference, that's also what Tornado Cash calls it). The most obvious idea to create a nullifier hash would be to simply use some hash of the public address. But careful! Since the Merkle Tree leaves are public, this would leak who's claiming the token via these nullifiers since an attacker can brute force through the list of addresses to figure out everyone's nullifiers. So we need a unique identifier for each address that's somehow not traceable back to an address. 🤔

Well, signatures do almost exactly that! A signature can only be generated by the owner of the private key corresponding to a public key, so it's a perfect mapping from an address to a nullifier BUT ECDSA signatures also implement [`ecrecover`](https://soliditydeveloper.com/ecrecover/) that allows for the extraction of the public key generating the signature using just the signature, so it still _leaks_ the public key (after all, that's one of the intended functions of a signature scheme!). So, we stack another idea on top: If we pass the signature through a one-way function, we'd scramble the signature (disallowing extraction of the public key) while retaining the nice injective property we originally desired!

Not so fast though, another interesting technical detail of ECDSA construction is the "malleability" property of signatures: Given a message and a keypair, the generated signature is actually not unique. For a signature identified by the tuple (`r`, `s`), (`r`, `N-s`) is in fact also a valid signature for the same message (where `N` is the order of the secp256k1 group). Since we're generating nullifiers using signatures, this would mean someone could swap the `s` value with `N-s` to double-claim tokens. The "fix" for this is to only allow for signatures that have an `s` value lower than 1/2 prime order. Typically, this restriction is called _canonicalisation_ of the signature. You can read more about this on [XRP's Transaction Malleability](https://xrpl.org/transaction-malleability.html) page.

## Bringing it together

With the bag of tricks we've been working up to in the previous sections, you might expect that we're done with the hairiest parts in the setup of the ZK proof. But it is never that simple. The bigger technical challenge ahead of us was the actual generation of proofs. Remember how we mentioned using ECDSA signature verification meant that we had a circuit with 9.6 million constraints? Even compiling the proving key for a circuit this big requires 40GB RAM and a 100GB+ SWAP! Luckily, this proving key only needs to be calculated once and will work for every zk airdrop with our construction in the future.

So yeah, we got a beefy 3.7GHz, 128GB RAM dedicated server that cost \~$15/day and started working with it. It turned out to be non-trivial to even get the compiler to use the full capabilities of our beefy server. Despite setting NodeJS's `max-old-space-size` flag, we would reach around 7GB RAM usage and the script would crash complaining about memory allocations. Yi Sun (one of the creators of the ECDSA circuit) pointed us to a rather [obscure trick](https://stackoverflow.com/questions/38558989/node-js-heap-out-of-memory/59923848#59923848) that resolved our issues. Incidentally, that StackOverflow answer is authored by jbaylina, one of the core contributors of snarkjs/circom. I can only imagine he was trying to do something similar to us when he discovered this trick. 🧐

While generating the proving key is one step in the direction, _using_ the proving key to generate a proof is a challenge in itself. You have a 6.5GB file that `snarkjs` almost continually reads pieces of, and uses those pieces (that are actually polynomial coefficients) to do complicated math. We had two options: Either we could set up a beefy remote SNARK prover and have users trust said server for proof generation, or we could figure out some way to stuff the computation in browser.

We had some ideas to figure out in-browser proving: What if we broke the proving key into small chunks, did whatever computation necessary for snarkjs, and garbage collects all the open buffers away. Well, we implemented exactly that: [Chunked zkeys](https://github.com/nalinbhardwaj/snarkjs/commit/d1c10a6373c02eaa214968da96e2514ddc8c8b92)! This enables splitting of the proving key file from a single \~6.5GB file to 10 pieces, each in its own file (the largest of which is \~2.3GB). Still, this is not enough to make the leap to in-browser proof generation: most computers/browsers would still be unable to support the \~4GB RAM requirement and the at least \~50GB SWAP requirement.

We reeaallly wanted to put these proofs in browser, but I think we're just a few years too early to be able to do that. Even using IndexedDB to use disc space as memory, we would still likely need a reduction of at least one or two orders of magnitude, and it's unlikely we'd be able to squeeze this out in the current state of zk SNARK tooling. Nonetheless, it is quite exciting to be able to make a project that runs into the edges of what's possible with the current box of production zk-SNARKs this way!

Ultimately, we decided to go with the _easier_ route of setting up a remote SNARK prover. Using a beefy server and a really clever queue-based implementation -- one that manages long-running proving jobs with no external dependencies and no overhead from Redis or other management databases (unlike standard NodeJS libraries like [Bull](https://github.com/OptimalBits/bull)). To ensure that we are not a trusted, centralized point of failure in the protocol, we provide all the infrastructure for you to set up your own remote snark prover (we encourage you to try it out!).

## On-chain contract

The onchain contract is relatively straightforward: we just have to check if a proof verifies and redeem the tokens if so. But it's never that simple, is it? 

The first _problem_ with our set-up is that we can only reward exactly one token to each address. What if you want to award multiple tokens to each address, perhaps with a complicated reward function for each address? A first idea might be to simply put the number of tokens each address should receive in the Merkle Tree. But this is unfortunately _privacy-lossy_. If everyone has an arbitrary amount of tokens to claim, that narrows down the possible claiming accounts greatly! In crypto parlance, we'd be reducing the anonymity set of a claimer if there are only a few possibilities for unique accounts trying to claim the airdrop. We had a few other ideas for doing so, but none of them seemed too promising at the time. We'd be curious to hear people's thoughts on this.

There is one final problem deserving more discussion: How does the account claiming the token get enough funds for paying the gas on the claim without connecting their identity in any way? This is a hard problem. One solution is to use Tornado Cash to obtain some funds first, but then you'd wonder how you even use Tornado Cash in the first place if you start with a completely fresh receiving wallet? Tornado Cash itself deals with this problem using [relayers](https://ethereum.stackexchange.com/questions/94740/how-tornado-cash-relayer-trustless-protocol-works). A relayer is essentially just a middle man who will make a transaction on your behalf, and take a small cut of the amount being withdrawn by the recipient. Well, why don't we do the same thing? With an airdrop of a new token, there's no guarantee the token has any "value" at all, so it's hard/impossible to incentivize relayers to run. However, an airdropper may be able to _force_ their token to have value by providing LP in Uniswap and other DEXs, incentivizing relayers from the beginning, but requiring an airdropper to invest so much upfront capital is not quite feasible. We came up with an idea that attempts to solve the two big pain points of a relayer set-up associated with airdrops:

1. Setting up and incentivizing a sufficiently decentralised network of relayers is non-trivial, and further, guaranteeing the availability of said relayers long into the future is nigh impossible.
2. The upfront capital required on an airdropper's part to assign value to their token will often be gatekeeping.

Our primary idea, inspired by [surrogeth](https://github.com/lsankar4033/surrogeth), is to use frontrunners as relayers. We take the evil exploiters and force them into functioning as an always-on, reliable network of relayers.

To do so, we simply make the claiming transaction award some ETH to the transaction initiator(`msg.sender`, in solidity parlance), and redeem the token to the address that generated the ZK proof (using a technique previously described in [WordLines - Replay Attacks](https://github.com/nalinbhardwaj/wordlines#replay-attacks))! If a claimer generates a ZK proof and broadcasts the transaction even with a minuscule gas price, a frontrunner will notice that rebroadcasting the transaction at a higher gas price will earn them money, so they'll just "relay" it for the claimer!

Notably, however, even with this technique, this means the contract somehow needs to be able to shed enough ETH to make frontrunning worthwhile. The cost of this ETH, however, is likely to be significantly lower compared to the cost of the aforementioned LP setup that exposes the airdropper to the token position (especially on L2s and sidechains). And in fact, this ETH doesn't even necessarily need to come from the airdropper: you can make a community chest that anyone can deposit to. While we don't advertise this feature in our frontend since xDai is already cheap enough to allow airdropper claimers to use a faucet for obtaining enough funds to initiate claims, our [contract](https://github.com/nalinbhardwaj/stealthdrop/blob/main/zkaffold-eth/packages/hardhat/contracts/SDT.sol) and [logic](https://github.com/nalinbhardwaj/stealthdrop/commit/26ddc41056d3d8aa21aadc52edf4510802b3cbe7#diff-1429de2a7d64bbd84588d839a5f7efe93419da77925f32d9f57fbede41e6e4a0R153) already implement this!


## A joust with the compilers

One other detour worth mentioning is our joust with Circom 2, the shiny new ZK-SNARK compiler. As we started mulching our brainstorming sessions into actual circuits, we started by installing Circom 2, only to discover it was just straight-up [broken](https://github.com/iden3/snarkjs/issues/107)! Witness calculation would just crash when you tried to generate a proof. In fact, it had been broken for nearly 3 months and had probably impacted countless others trying to compile circuits.

We took it upon ourselves to fix this. What followed was a day or two of debugging the Circom compiler, snarkjs and all of their dependencies. With a lot of help from [@phated](https://github.com/phated), we went from handwriting binary files to figure out what's broken (0/10 would not recommend) to writing out 3 PRs across circom/snarkjs that fix [all](https://github.com/iden3/circom_runtime/pull/16) [the](https://github.com/iden3/circom_runtime/pull/14) [issues](https://github.com/iden3/snarkjs/pull/121)! As a side effect, one of the PRs also reduces the snarkjs bundle size by a significant fraction, making for faster load times for in-browser proof verification.

As a follow up from the work on chunked proving keys and these compiler fixes, we also ended up discovering a performance improvement in `snarkjs` that speeds up `FullProve` calls by nearly 1 second flat! (That's \~30% proving time for small circuits). You can read more about this optimization [here](https://github.com/iden3/snarkjs/pull/124).


# Who?

We ([Aayush (@Divide-By-0)](https://github.com/Divide-By-0), [@nibnalin](https://github.com/nalinbhardwaj) and [@Adhyyan1252](https://github.com/Adhyyan1252)) built out this project over the course of a week during [Hack Lodge](https://hacklodge.org). The original idea of this construction came from [@gubsheep](https://github.com/gubsheep), [Yi Sun](https://github.com/yi-sun) and the [0xPARC community](https://0xparc.org).

The journey we shared in writing this project was long and windy (to say the least). Besides the very real technical challenges, there was almost a running joke with the kinds of bugs we bumped into:

1. It turns out the "canonical" signature format is the opposite between `libsecp256k1` and `openssl`, one of them uses `s` values less than 1/2 prime order, and the other one uses `s` values more than 1/2 prime order.
2. For some reason, there exists a CORS mode called `no-cors`, and if you use that (while debugging your server), all the request data formatting gets stripped, so the request fails invisibly. 🤷‍♂️
3. The only way to ask MetaMask/WalletConnect for your public key is to ask for a signature instead and run `ecrecover` on this signature. I have no idea why it's not just part of the standard API.
4. Did you know that the MIMC hash function Tornado Cash uses is not the same as the MIMC hash function used by Dark Forest? 🤷‍♂️

Despite all the hiccups, we had a lot of fun and did get to a working implementation a few hours before demo time! It was a great experience hacking on something like this with a large group of people working on their own, equally impressive [projects around us](https://twitter.com/smsunarto/status/1483202893826064384) at HackLodge! I'll leave you with a blooper reel from our own project:

<p>
<img width="132" alt="Screenshot 2022-01-17 at 3 47 09 PM" src="https://user-images.githubusercontent.com/6984346/149874381-de66e8ec-594d-42e8-9f99-34b61f28a855.png">

<em>No plan is complete without a good nap 😴</em>

</p>

<p>
<img src="https://user-images.githubusercontent.com/6984346/149874407-aee0a9aa-cd8f-4220-a4b3-bc8731be8556.png" alt="commits" width="400"/>

<em>2AM commits do be like that sometimes</em>

</p>

As previously mentioned, the ECDSA construction was implemented by members of the 0xPARC community and open-sourced just a few weeks ago: https://github.com/0xPARC/circom-secp256k1.

The Merkle Tree construction and other primitives were strongly inspired by the Tornado Cash protocol and its code: https://github.com/tornadocash.

If you'd like to run your own remote SNARK prover or set up your own airdrop, take a look at [USAGE.md](./USAGE.md) for more information.
