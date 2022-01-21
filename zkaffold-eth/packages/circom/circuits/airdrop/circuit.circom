pragma circom 2.0.2;

include "../merkle/withdraw.circom";
include "../secp256k1/ecdsa.circom";
include "../secp256k1/bigint.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

template Main(levels, n, k) {
    signal input root;
    signal input r[k];
    signal input s[k];
    signal input msghash[k];
    signal input pubkey[2][k];
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal input publicClaimerAddress;
    signal input privateClaimerAddress;
    signal input nullifierHash;

    component sigVerify = ECDSAVerify(n, k);
    for (var i = 0;i < k;i++) {
        sigVerify.r[i] <== r[i];
        sigVerify.s[i] <== s[i];
        sigVerify.msghash[i] <== msghash[i];
        for (var j = 0;j < 2;j++) sigVerify.pubkey[j][i] <== pubkey[j][i];
    }

    component withdrawal = Withdraw(levels, n, k);
    withdrawal.root <== root;
    for (var i = 0;i < k;i++) {
        for (var j = 0;j < 2;j++) withdrawal.pubkey[j][i] <== pubkey[j][i];
    }
    for (var i = 0;i < levels;i++) {
        withdrawal.pathElements[i] <== pathElements[i];
        withdrawal.pathIndices[i] <== pathIndices[i];
    }

    component nullifier = Nullify(k);
    for (var i = 0;i < k;i++) {
        nullifier.r[i] <== r[i];
        nullifier.s[i] <== s[i];
    }
    nullifierHash === nullifier.nullifierHash;

    component canoniCheck = BigLessThan(n, k);
    for (var i = 0;i < k;i++) canoniCheck.a[i] <== s[i];
    canoniCheck.b[0] <== 43899669914813478955851936;
    canoniCheck.b[1] <== 77371252455333472729943390;
    canoniCheck.b[2] <== 9671406556917033397649407;
    canoniCheck.out === 1;

    component equality = IsEqual();
    equality.in[0] <== publicClaimerAddress;
    equality.in[1] <== privateClaimerAddress;
    equality.out === 1;
}

component main {public [root, msghash, nullifierHash, publicClaimerAddress]} = Main(20, 86, 3);
