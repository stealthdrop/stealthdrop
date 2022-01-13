pragma circom 2.0.2;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pedersen.circom";
include "merkleTree.circom";

// computes Pedersen(nullifier + secret)
template CommitmentHasher() {
    signal input nullifier;
    signal input secret;
    signal output commitment;
    signal output nullifierHash;

    component commitmentHasher = Pedersen(496);
    component nullifierHasher = Pedersen(248);
    component nullifierBits = Num2Bits(248);
    component secretBits = Num2Bits(248);
    nullifierBits.in <== nullifier;
    secretBits.in <== secret;
    for (var i = 0; i < 248; i++) {
        nullifierHasher.in[i] <== nullifierBits.out[i];
        commitmentHasher.in[i] <== nullifierBits.out[i];
        commitmentHasher.in[i + 248] <== secretBits.out[i];
    }

    commitment <== commitmentHasher.out[0];
    nullifierHash <== nullifierHasher.out[0];
}

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
template Withdraw(levels, k) {
    signal input root;
    signal input r[k];
    signal input s[k];
    signal input pubkey[k];
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // These two are added to ensure that no one can frontrun this proof
    signal input claimerAddress;
    signal input claimerAddressMinusOne;

    signal output nullifierHash;

    component pubmimc = ArrayMIMC(k);
    for (var i = 0;i < k;i++) pubmimc.inp[i] <== pubkey[i];

    component sigmimc = ArrayMIMC(k*2);
    for (var i = 0;i < k;i++) sigmimc.inp[i] <== r[i];
    for (var i = 0;i < k;i++) sigmimc.inp[k + i] <== s[i];

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== pubmimc.mimc;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    component hasher = CommitmentHasher();
    hasher.nullifier <== sigmimc.mimc;
    hasher.secret <== pubmimc.mimc;
    nullifierHash <== hasher.nullifierHash;

    // Left to ensure it doesn't get optimized out (I hope -- tornado.cash uses squares)
    claimerAddressMinusOne <== claimerAddress - 1;

}
