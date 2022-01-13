pragma circom 2.0.2;

include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/pedersen.circom";
include "../vocdoni-keccak/keccak.circom";
include "merkleTree.circom";
include "../zk-identity/eth.circom";
include "../secp256k1/bigint.circom";

// computes Pedersen(nullifier + secret)
template CommitmentHasher() {
    signal input nullifier;
    // signal input secret;
    // signal output commitment;
    signal output nullifierHash;

    // component commitmentHasher = Pedersen(496);
    component nullifierHasher = Pedersen(248);
    component nullifierBits = Num2Bits(248);
    // component secretBits = Num2Bits(248);
    nullifierBits.in <== nullifier;
    // secretBits.in <== secret;
    for (var i = 0; i < 248; i++) {
        nullifierHasher.in[i] <== nullifierBits.out[i];
        // commitmentHasher.in[i] <== nullifierBits.out[i];
        // commitmentHasher.in[i + 248] <== secretBits.out[i];
    }

    // commitment <== commitmentHasher.out[0];
    nullifierHash <== nullifierHasher.out[0];
}

// Verifies that commitment that corresponds to given secret and nullifier is included in the merkle tree of deposits
template Withdraw(levels, k) {
    signal input root;
    signal input r[k];
    signal input s[k];
    signal input pubkey[2][k];
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // These two are added to ensure that no one can frontrun this proof
    signal input claimerAddress;
    signal input claimerAddressMinusOne;
    signal output nullifierHash;

    // Verify the Keccak(pk.x || pk.y) maps to the hash(address)
    component addressGenerator = PubkeyToAddress();
    component n2b[2 * k];

    for (var i = 0; i < k; i++) {
        n2b[i] = Num2Bits(256 / k + 1);
        n2b[i].in <== pubkey[0][i];
        for (var j = 0; j < 256 / k + 1; j++) {
            addressGenerator.pubkeyBits[j + i * (256 / k + 1)] <== n2b[i].out[j];
        }
    }
    for (var i = 0; i < k; i++) {
        n2b[k + i] = Num2Bits(256 / k + 1);
        n2b[k + i].in <== pubkey[1][i];
        for (var j = 0; j < 256 / k + 1; j++) {
            addressGenerator.pubkeyBits[256 + j + i * (256 / k + 1)] <== n2b[k+i].out[j];
        }
        // TODO: definitely an off by 1 error here
        // TODO: use SplitThreeFn instead
    }
    // for (var i = 0; i < 256 / k; i++) {
    //     addressGenerator.pubkeyBits[i] <== pubkey[0][i];
    //     addressGenerator.pubkeyBits[i+256] <== pubkey[1][i];
    // }
    var address = addressGenerator.address;
    // TODO replace MIMC with Pedersen
    component addressMimc = MiMCSponge(1, 220, 1);
    addressMimc.ins[0] <== address;
    addressMimc.k <== 0;

    // Calculate MIMC of the signature
    component sigmimc = ArrayMIMC(k*2);
    for (var i = 0;i < k;i++) sigmimc.inp[i] <== r[i];
    for (var i = 0;i < k;i++) sigmimc.inp[k + i] <== s[i];
    // TODO: need to verify ArrayMIMC is even doing the right thing

    // Verify the MIMC(address) is the Merkle tree
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== addressMimc.outs[0];
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    // Compute and verify the nullifier hash and
    component hasher = CommitmentHasher();
    hasher.nullifier <== sigmimc.mimc; // The signature should be the public thing
    // hasher.secret <== addressMimc.outs[0];
    nullifierHash === hasher.nullifierHash;

    // Left to ensure it doesn't get optimized out (I hope -- tornado.cash uses squares)
    claimerAddressMinusOne === claimerAddress - 1;
}
