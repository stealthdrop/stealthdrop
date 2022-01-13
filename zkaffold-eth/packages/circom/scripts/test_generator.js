const MerkleTree = require('fixed-merkle-tree');
const circomlib = require('tornado-circomlib');
const snarkjs = require('snarkjs');
const bigInt = snarkjs.bigInt;
// const crypto = require('crypto');
const ethers = require('ethers');
const { getPublicKey, sign, Point, CURVE } = require('@noble/secp256k1');
const keccak256 = require('keccak256');
const { assert } = require('console');
const fs = require('fs');

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

async function generateTestCases() {
  // privkey, msghash, pub0, pub1
  const test_cases = [];
  const proverPrivkeys = [
    BigInt('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'),
    88549154299169935420064281163296845505587953610183896504176354567359434168161n,
    90388020393783788847120091912026443124559466591761394939671630294477859800601n,
    110977009687373213104962226057480551605828725303063265716157300460694423838923n,
  ];
  const claimerPrivkeys = [
    BigInt('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'),
    88549154299169935420064281163296845505587953610183896504176354567359434168161n,
    90388020393783788847120091912026443124559466591761394939671630294477859800601n,
    110977009687373213104962226057480551605828725303063265716157300460694423838923n,
  ];
  const k = 3;

  function parseSignature(signature) {
    let r = signature.slice(0, 32);
    let s = signature.slice(32, 64);
    const v = 27 + Number(signature[64] >= 128);
    if (typeof r == 'object') {
      r = Uint8Array_to_bigint(r).toString();
    }
    if (typeof s == 'object') {
      s = Uint8Array_to_bigint(s).toString();
    }
    return { r, s, v };
  }
  function split(m, k) {
    // m is the string, k is the number of registers (parts)
    const bytes_split = [];
    const len = m.length;
    const register_length = len / k;

    // Pad with zeros
    if (len > register_length * k) {
      m = '0'.repeat(len - register_length * k) + m;
      register_length++;
    }

    // Split into registers
    for (let i = 0; i < k; i++) {
      bytes_split.push(m.slice(register_length * i, register_length * (i + 1)));
    }
    return bytes_split;
  }
  for (var idx = 0; idx < proverPrivkeys.length; idx++) {
    const privkey = proverPrivkeys[idx];
    const pubkey = Point.fromPrivateKey(privkey);
    const msg = 'zk-airdrop';
    const msghash_bigint = Uint8Array_to_bigint(keccak256(msg)); // Needs to be basicaly some public random hardcoded value
    const msghash = bigint_to_Uint8Array(msghash_bigint);
    const sig = await sign(msghash, bigint_to_Uint8Array(privkey), {
      canonical: true,
      der: false,
    });
    const { r, s, v } = parseSignature(sig); //TODO maybe just sig
    test_cases.push([privkey, msghash_bigint, sig, pubkey.x, pubkey.y]);

    // Get address from public key: https://ethereum.stackexchange.com/questions/29476/generating-an-address-from-a-public-key
    // let fullPubKey = keccak256(pubkey.x.toString() + pubkey.y.toString());
    // TODO: doesnt check out

    const wallet = new ethers.Wallet(privkey);
    const hexAddress = wallet.address.slice(2, wallet.address.length);
    console.log(
      'Address: ',
      hexAddress,
      fromHexString(hexAddress),
      wallet.address,
      hexStringToBigInt(hexAddress)
    );
    console.log('Private key: ', privkey);

    // Generate merkle tree and path
    const tree = new MerkleTree(16);
    const pedersenHash = (data) =>
      circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];
    const nullifierHash = pedersenHash(hexAddress);
    tree.insert(nullifierHash);

    const { pathElements, pathIndices } = tree.path(0);
    // for (const sister in pathElements) {
    //   pathElements[sister] = intToHex(pathElements[sister]);
    // }
    for (const sister in pathIndices) {
      pathIndices[sister] = pathIndices[sister].toString();
    }
    console.log("root", intToHex(tree.root()));
    console.log("msghash", msghash);

    
    const json = JSON.stringify(
        {
          root: tree.root(),
          r: split(r, k),
          s: split(s, k),
          msghash: split(msghash_bigint.toString(), k),
          pubkey: [split(pubkey.x.toString(), k), split(pubkey.y.toString(), k)],
          pathElements: pathElements,
          pathIndices: pathIndices,
          claimerAddress: hexStringToBigInt(hexAddress).toString(10),
          claimerAddressMinusOne: (hexStringToBigInt(hexAddress) - BigInt(1)).toString(10),
          nullifierHash: nullifierHash.toString(),
        },
        null,
        '\t'
      );
    fs.writeFile('circuits/airdrop/inputs/input_' + idx.toString() + '.json', json, 'utf8', () => {});
  }
}

generateTestCases();
