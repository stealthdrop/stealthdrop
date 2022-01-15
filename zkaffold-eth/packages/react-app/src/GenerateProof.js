import { getPath, merkleTreeRoot } from "./AirdropData";
import mimcHash from "./mimc";

function hexStringToBytes(hexString) {
  // skip first 2 chars (0x)
  const bytes = [];
  for (let c = 2; c < hexString.length; c += 2) {
    bytes.push(parseInt(hexString.substr(c, 2), 16));
  }
  return bytes;
}

function parseSignature(sigString) {
  const signature = hexStringToBytes(sigString);
  let r = signature.slice(0, 32);
  let s = signature.slice(32, 64);
  return { r, s };
}

function splitValue(x) {
  const n = 86;
  const k = 3;
  const val = Array(3);
  for (var i = 0; i < k; i++) {
    val[i] = Uint8ArrayToHexString(x.slice(i * n, (i + 1) * n));
  }
  return val;
}

function Uint8ArrayToHexString(u8a) {
  return Array.from(u8a, c => c.toString(16).padStart(2, "0")).join("");
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
