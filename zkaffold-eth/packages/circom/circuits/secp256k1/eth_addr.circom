pragma circom 2.0.2;

include "./zk-identity/eth.circom";
include "./ecdsa.circom";

template PrivKeyToAddr(n, k) {
    signal input privkey[k];
    signal output addr;

    component privToPub = ECDSAPrivToPub(n, k);
    for (var i = 0; i < k; i++) {
        privToPub.privkey[i] <== privkey[i];
    }

    component flattenPub = FlattenPubkey(n, k);
    for (var i = 0; i < k; i++) {
        flattenPub.chunkedPubkey[0][i] <== privToPub.pubkey[0][i];
        flattenPub.chunkedPubkey[1][i] <== privToPub.pubkey[1][i];
    }

    component pubToAddr = PubkeyToAddress();
    for (var i = 0; i < 512; i++) {
        pubToAddr.pubkeyBits[i] <== flattenPub.pubkeyBits[i];
    }

    addr <== pubToAddr.address;
}