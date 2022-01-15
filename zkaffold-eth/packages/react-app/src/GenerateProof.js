import { getPath, merkleTreeRoot } from "./AirdropData";
import { mimcHash } from "./mimc";
import bigInt, { BigInteger } from 'big-integer';
import { ethers } from "ethers";

const fromHexString = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const intToHex = (intString) => ethers.BigNumber.from(intString).toHexString();
const hexStringTobigInt = (hexString) => {
  return Uint8Array_to_bigint(fromHexString(hexString));
};

// bigendian
function bigint_to_Uint8Array(x) {
  var ret = new Uint8Array(32);
  for (var idx = 31; idx >= 0; idx--) {
    ret[idx] = Number(x % 256n);
    x = x / 256n;
  }
  return ret;
}

// bigendian
function Uint8Array_to_bigint(x) {
  var ret = 0n;
  for (var idx = 0; idx < x.length; idx++) {
    ret = ret * 256n;
    ret = ret + bigInt(x[idx]);
  }
  return ret;
}

function bigint_to_tuple(x) {
    // 2 ** 86
    let mod = 77371252455336267181195264n;
    let ret = [0n, 0n, 0n];

    var x_temp = x;
    for (var idx = 0; idx < 3; idx++) {
        ret[idx] = x_temp % mod;
        x_temp = x_temp / mod;
    }
    return ret;
}

function bigint_to_array(n, k, x) {
    let mod = 1n;
    for (var idx = 0; idx < n; idx++) {
        mod = mod * 2n;
    }

    let ret = [];
    var x_temp = x;
    for (var idx = 0; idx < k; idx++) {
        ret.push(x_temp % mod);
        x_temp = x_temp / mod;
    }
    return ret;
}

function parseSignature(sig) {
    const sig_arr = bigint_to_Uint8Array(hexStringTobigInt(sig));
    const r = sig_arr.slice(0, 32);
    const s = sig_arr.slice(32, 64);
    var r_bigint = Uint8Array_to_bigint(r);
    var s_bigint = Uint8Array_to_bigint(s);
    var r_array = bigint_to_array(86, 3, r_bigint);
    var s_array = bigint_to_array(86, 3, s_bigint);
    return {r_array, s_array};
}

function parsePubkey(pk) {
    const sliced_pk = pk.slice(4);
    const pk_x_hex = pk.slice(0, 64);
    const pk_y_hex = pk.slice(64, 128);
    const pk_x_bigint = hexStringTobigInt(pk_x_hex);
    const pk_y_bigint = hexStringTobigInt(pk_y_hex);
    const pk_x_arr = bigint_to_array(86, 3, pk_x_bigint);
    const pk_y_arr = bigint_to_array(86, 3, pk_y_bigint);
    return { pk_x_arr, pk_y_arr }
}


export function generateProofInputs(address, signature, proverPubkey, claimerAddress, msghash) {
  const val = getPath(address);
  if(!val) return null;
  const [root, pathElements, pathIndices] = val;
  const { r_array, s_array } = parseSignature(signature);
  const { pubkey_x, pubkey_y } = parsePubkey(proverPubkey);

  const msghash_bigint = hexStringTobigInt(msghash);
  var msghash_array = bigint_to_array(86, 3, msghash_bigint);

  const nullifierHash = mimcHash(1)(r_array[0], r_array[1], r_array[2], s_array[0], s_array[1], s_array[2]);

  const input = {
    root: root,
    pathElements: pathElements,
    pathIndices: pathIndices,
    r: r_array.map(x => x.toString()),
    s: s_array.map(x => x.toString()),
    msghash: msghash_array.map(x => x.toString()),
    pubkey: [bigint_to_tuple(pubkey_x).map(x => x.toString()), bigint_to_tuple(pubkey_y).map(x => x.toString())],
    publicClaimerAddress: hexStringTobigInt(claimerAddress).toString(10),
    privateClaimerAddress: hexStringTobigInt(claimerAddress).toString(10),
    nullifierHash: nullifierHash.toString(),
  };

  return input;
}
