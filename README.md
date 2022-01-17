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

[insert snapshot labs image leaking addresses]

On the other end of the spectrum, when someone with a public identity deviates from the norm and casts a vote others in the community don't like, they end up exposing themselves to harassment on Twitter and other social media.

[insert t11s tweets https://twitter.com/transmissions11/status/1465376966450708483]

[insert https://twitter.com/BrantlyMillegan/status/1458167522340052992]

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

### ECDSA Signature Verification

### Merkle Tree construction

### Nullifier hash construction

## On-chain contract

# Who?

We (@divide-by-0, @nibnalin and @adhyyan) built out this project over the course of a week during Hack Lodge. The original idea of this construction came from @gubsheep and the 0xparc community.

The journey we shared in writing this project was kind of wild to say the least.

We started by installing Circom 2, the shiny new ZK-SNARK compiler, only to discover that apparently it was just straight-up [broken](https://github.com/iden3/snarkjs/issues/107)! Witness calculation would just crash when you tried to generate a proof.

We took it upon ourselves to fix this. What followed was a day or two of debugging the Circom compiler, snarkjs and all of their dependencies. With a lot of help from @phated, we went from handwriting binary files to figure out what's broken (0/10 would not recommend) to writing out 3 PRs across circom/snarkjs that fix [all](https://github.com/iden3/circom_runtime/pull/16) [the](https://github.com/iden3/circom_runtime/pull/14) [issues](https://github.com/iden3/snarkjs/pull/121)! As a side effect, one of the PRs also reduces the snarkjs bundle size by ~20%, making for faster load times for in-browser proof verification.




The ECDSA construction was implemented by members of the 0xparc community and open-sourced just a few weeks ago: https://github.com/0xPARC/circom-secp256k1.

The Merkle Tree construction and other primitives were strongly inspired by the Tornado Cash protocol and its code: https://github.com/tornadocash.
