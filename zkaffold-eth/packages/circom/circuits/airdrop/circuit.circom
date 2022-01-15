pragma circom 2.0.2;

include "../merkle/withdraw.circom";
include "../secp256k1/ecdsa.circom";
include "../secp256k1/bigint.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

template Main(levels, n, k) {
    // signal input root;
    signal input r[k];
    signal input s[k];
    // signal input msghash[k];
    // signal input pubkey[2][k];
    // signal input pathElements[levels];
    // signal input pathIndices[levels];

    signal input claimerAddress;
    signal input claimerAddressMinusOne;
    signal input nullifierHash;

    // Check the s in the signature for non-malleability

    component checkSForNonmalleability = BigLessThan(n, k);
    for(var i = 0; i < k; i++) {
        checkSForNonmalleability.a[i] <== s[i];
        log(i);
        log(s[i]);
    }
    checkSForNonmalleability.b[0] <== 9671406556917033397649407;
    checkSForNonmalleability.b[1] <== 77371252455333472729943390;
    checkSForNonmalleability.b[2] <== 43899669914813478955851936;
    log(checkSForNonmalleability.out);
    checkSForNonmalleability.out === 1;

    // component sigVerify = ECDSAVerify(n, k);
    // for (var i = 0;i < k;i++) {
    //     sigVerify.r[i] <== r[i];
    //     sigVerify.s[i] <== s[i];
    //     sigVerify.msghash[i] <== msghash[i];
    //     for (var j = 0;j < 2;j++) sigVerify.pubkey[j][i] <== pubkey[j][i];
    // }

    // component withdrawal = Withdraw(levels, n, k);
    // withdrawal.root <== root;
    // for (var i = 0;i < k;i++) {
    //     for (var j = 0;j < 2;j++) withdrawal.pubkey[j][i] <== pubkey[j][i];
    // }
    // for (var i = 0;i < levels;i++) {
    //     withdrawal.pathElements[i] <== pathElements[i];
    //     withdrawal.pathIndices[i] <== pathIndices[i];
    // }

    component nullifier = Nullify(k);
    for (var i = 0;i < k;i++) {
        nullifier.r[i] <== r[i];
        nullifier.s[i] <== s[i];
    }
    nullifierHash === nullifier.nullifierHash;

    component replay = CheckReplay();
    replay.claimerAddress <== claimerAddress;
    replay.claimerAddressMinusOne <== claimerAddressMinusOne;
}

template flattenChunks(numBits, k) {
  signal input chunkedInput[k];
  signal output pubkeyBits[256];

  // must be able to hold entire pubkey in input
  assert(numBits*k >= 256);

  // convert pubkey to a single bit array
  // - concat x and y coords
  // - convert each register's number to corresponding bit array
  // - concatenate all bit arrays in order

  component chunks2Bits[k];
  for(var chunk = 0; chunk < k; chunk++){
    chunks2Bits[chunk] = Num2Bits(numBits);
    chunks2Bits[chunk].in <== chunkedInput[chunk];

    for(var bit = 0; bit < numBits; bit++){
        var bitIndex = bit + numBits * chunk;
        if(bitIndex < 256) {
          pubkeyBits[bitIndex] <== chunks2Bits[chunk].out[bit];
        }
    }
  }
}

component main{public [claimerAddress]} = Main(1, 86, 3);
