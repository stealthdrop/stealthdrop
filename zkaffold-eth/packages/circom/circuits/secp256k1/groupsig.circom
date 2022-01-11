pragma circom 2.0.2;

include "../../node_modules/circomlib/circuits/mimcsponge.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "./eth_addr.circom";

/*
  Inputs:
  - addr1 (pub)
  - addr2 (pub)
  - addr3 (pub)
  - msg (pub)
  - privkey

  Intermediate values:
  - myAddr (supposed to be addr of privkey)
  
  Output:
  - msgAttestation
  
  Prove:
  - PrivKeyToAddr(privkey) == myAddr
  - (x - addr1)(x - addr2)(x - addr3) == 0
  - msgAttestation == mimc(msg, privkey)
*/

template Main(n, k) {
    assert(n * k >= 256);
    assert(n * (k-1) < 256);

    signal input privkey[k];
    signal input addr1;
    signal input addr2;
    signal input addr3;
    signal input msg;

    signal myAddr;

    signal output msgAttestation;

    // check that privkey properly represents a 256-bit number
    component n2bs[k];
    for (var i = 0; i < k; i++) {
        n2bs[i] = Num2Bits(i == k-1 ? 256 - (k-1) * n : n);
        n2bs[i].in <== privkey[i];
    }

    // compute addr
    component privToAddr = PrivKeyToAddr(n, k);
    for (var i = 0; i < k; i++) {
        privToAddr.privkey[i] <== privkey[i];
    }
    myAddr <== privToAddr.addr;

    // verify address is one of the provided
    signal temp;
    temp <== (myAddr - addr1) * (myAddr - addr2);
    0 === temp * (myAddr - addr3);
    
    // produce signature
    component mimcAttestation = MiMCSponge(k+1, 220, 1);
    mimcAttestation.ins[0] <== msg;
    for (var i = 0; i < k; i++) {
        mimcAttestation.ins[i+1] <== privkey[i];
    }
    mimcAttestation.k <== 0;
    msgAttestation <== mimcAttestation.outs[0];
}

component main {public [addr1, addr2, addr3, msg]} = Main(86, 3);