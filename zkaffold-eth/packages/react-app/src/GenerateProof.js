/* global BigInt */
import { getPath, merkleTreeRoot } from "./AirdropData";
import { mimcHash } from "./mimc";
import bigInt from "big-integer";
import { ethers } from "ethers";

const fromHexString = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const intToHex = intString => ethers.BigNumber.from(intString).toHexString();
const hexStringTobigInt = hexString => {
  return Uint8Array_to_bigint(fromHexString(hexString));
};

// bigendian
function bigint_to_Uint8Array(x) {
  var ret = new Uint8Array(64);
  for (var idx = 63; idx >= 0; idx--) {
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
    ret = ret + BigInt(x[idx]);
  }
  return ret;
}

function bigint_to_tuple(x) {
  // 2 ** 86
  x = BigInt(x);
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
  console.log("sig", sig);
  const r_hex = sig.slice(2, 66);
  const s_hex = sig.slice(66, 66 + 64);
  // console.log("sig stuff", sig_arr.length, sig_arr);
  var r_bigint = hexStringTobigInt(r_hex);
  var s_bigint = hexStringTobigInt(s_hex);
  var r_array = bigint_to_array(86, 3, r_bigint);
  var s_array = bigint_to_array(86, 3, s_bigint);
  console.log("s_bigint", s_bigint);
  return [r_array, s_array];
}

function parsePubkey(pk) {
  const sliced_pk = pk.slice(4);
  const pk_x_hex = sliced_pk.slice(0, 64);
  const pk_y_hex = sliced_pk.slice(64, 128);
  const pk_x_bigint = hexStringTobigInt(pk_x_hex);
  const pk_y_bigint = hexStringTobigInt(pk_y_hex);
  const pk_x_arr = bigint_to_array(86, 3, pk_x_bigint);
  const pk_y_arr = bigint_to_array(86, 3, pk_y_bigint);
  console.log("pk stuff", pk, pk_x_arr, pk_y_arr);
  return [pk_x_arr, pk_y_arr];
}

export function generateProofInputs(address, signature, proverPubkey, claimerAddress, msghash) {
  const val = getPath(address);
  if (!val) return null;
  const [root, pathElements, pathIndices] = val;
  console.log("signature", signature);
  const [r_array, s_array] = parseSignature(signature);
  const [pubkey_x, pubkey_y] = parsePubkey(proverPubkey);

  const msghash_bigint = hexStringTobigInt(msghash);
  var msghash_array = bigint_to_array(86, 3, msghash_bigint);

  const nullifierHash = mimcHash(123)(r_array[0], r_array[1], r_array[2], s_array[0], s_array[1], s_array[2]);

  const input = {
    root: root.toString(),
    pathElements: pathElements.map(x => x.toString()),
    pathIndices: pathIndices,
    r: r_array.map(x => x.toString()),
    s: s_array.map(x => x.toString()),
    msghash: msghash_array.map(x => x.toString()),
    pubkey: [pubkey_x.map(x => x.toString()), pubkey_y.map(x => x.toString())],
    publicClaimerAddress: hexStringTobigInt(claimerAddress).toString(10),
    privateClaimerAddress: hexStringTobigInt(claimerAddress).toString(10),
    nullifierHash: nullifierHash.toString(),
  };

  return input;
}
