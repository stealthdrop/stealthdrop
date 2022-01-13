include "../../node_modules/circomlib/circuits/mimcsponge.circom";

// Computes MiMC([left, right])
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = MiMCSponge(2, 220, 1); // secp library on an earlier version of circom without the 220, // TODO is the code different?
    hasher.ins[0] <== left;
    hasher.ins[1] <== right;
    hasher.k <== 0;
    hash <== hasher.outs[0];
}

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0])*s + in[0];
    out[1] <== (in[0] - in[1])*s + in[1];
}

// Verifies that merkle proof is correct for given merkle root and a leaf
// pathIndices input is an array of 0/1 selectors telling whether given pathElement is on the left or right side of merkle path
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component selectors[levels];
    component hashers[levels];

    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i - 1].hash;
        selectors[i].in[1] <== pathElements[i];
        selectors[i].s <== pathIndices[i];

        hashers[i] = HashLeftRight();
        hashers[i].left <== selectors[i].out[0];
        hashers[i].right <== selectors[i].out[1];
    }

    root === hashers[levels - 1].hash;
}

template ArrayMIMC(k) {
    signal input inp[k];
    signal output mimc;

    component prefix_hash[k];
    for(var i = 0;i < k;i++) prefix_hash[i] = HashLeftRight();
    for(var i = 0;i < k;i++) {
        if (i == 0) {
            prefix_hash[i].left <== inp[i];
            prefix_hash[i].right <== inp[i+1]; // TODO: this works when k = 1 but doesnt seem correct OTHERWISE
        }
        else {
            prefix_hash[i].left <== inp[i];
            prefix_hash[i].right <== prefix_hash[i-1].hash; // TODO: arent left and right switched
        }
    }
    mimc <== prefix_hash[k-1].hash;
}
