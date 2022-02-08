pragma circom 2.0.2;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/pedersen.circom";
include "../secp256k1/vocdoni-keccak/keccak.circom";
include "merkleTree.circom";
include "../secp256k1/zk-identity/eth.circom";
include "../secp256k1/bigint.circom";
include "../../node_modules/circomlib/circuits/mimcsponge.circom";

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
// Levels in merkle tree, n is the number of bits per each of the k registers
template Withdraw(levels, n, k) {
    signal input root;
    signal input pubkey[2][k];
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component flattenPub = FlattenPubkey(n, k);
    for (var i = 0; i < k; i++) {
        flattenPub.chunkedPubkey[0][i] <== pubkey[0][i];
        flattenPub.chunkedPubkey[1][i] <== pubkey[1][i];
    }

    component addressGen = PubkeyToAddress();
    for (var i = 0;i < 512;i++) addressGen.pubkeyBits[i] <== flattenPub.pubkeyBits[i];
    log(addressGen.address);

    component addressMimc = MiMCSponge(1, 220, 1);
    addressMimc.ins[0] <== addressGen.address;
    addressMimc.k <== 123;

    log(addressMimc.outs[0]);

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== addressMimc.outs[0];
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
}

template Nullify(k) {
    signal input r[k];
    signal input s[k];
    signal output nullifierHash;

    component mimc = MiMCSponge(2*k, 220, 1);
    for (var i = 0;i < 3;i++) mimc.ins[i] <== r[i];
    for (var i = 3;i < 6;i++) mimc.ins[i] <== s[i-3];
    mimc.k <== 123;

    nullifierHash <== mimc.outs[0];
}
