import { getPath, merkleTreeRoot } from "./AirdropData";
import mimcHash from "./mimc";

// function hexStringToBytes(hexString) {
//   // skip first 2 chars (0x)
//   const bytes = [];
//   for (let c = 2; c < hexString.length; c += 2) {
//     bytes.push(parseInt(hexString.substr(c, 2), 16));
//   }
//   return bytes;
// }


// function Uint8ArrayToHexString(u8a) {
//   return Array.from(u8a, c => c.toString(16).padStart(2, "0")).join("");
// }

const fromHexString = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const intToHex = (intString) => ethers.BigNumber.from(intString).toHexString();
const hexStringToBigInt = (hexString) => {
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
    ret = ret + BigInt(x[idx]);
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



export function generateProofInputs(address, signature) {
  const val = getPath(address);
  if(!val) return null;
  const [pathElements, pathIndex] = val;
  const { r, s } = parseSignature(signature);
  const rr = splitValue(r);
  const ss = splitValue(s);


  const input = {
    r: rr,
    s: ss,
    pathElements,
    pathIndex,
    root: merkleTreeRoot,
    claimerAddress: address,
  };
  return input;
}
