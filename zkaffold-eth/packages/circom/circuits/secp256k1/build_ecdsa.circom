pragma circom 2.0.2;

include "ecdsa.circom";

component main {public [privkey]} = ECDSAPrivToPub(86, 3);
