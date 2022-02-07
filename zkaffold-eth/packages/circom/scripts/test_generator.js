const MerkleTree = require("fixed-merkle-tree");
const circomlib = require("tornado-circomlib");
const snarkjs = require("snarkjs");
const bigInt = snarkjs.bigInt;
// const crypto = require('crypto');
const ethers = require("ethers");
const { getPublicKey, sign, Point, CURVE } = require("@noble/secp256k1");
const keccak256 = require("keccak256");
const { assert } = require("console");
const fs = require("fs");
const mimcfs = require("./mimc.js");

const fromHexString = (hexString) => new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

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
    BigInt("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"),
    88549154299169935420064281163296845505587953610183896504176354567359434168161n,
    90388020393783788847120091912026443124559466591761394939671630294477859800601n,
    BigInt("0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"),
  ];
  const claimerPrivkeys = [
    90388020393783788847120091912026443124559466591761394939671630294477859800601n,
    BigInt("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"),
    88549154299169935420064281163296845505587953610183896504176354567359434168161n,
    BigInt("0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"),
  ];

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

  // bigendian
  function Uint8Array_to_bigint(x) {
    var ret = 0n;
    for (var idx = 0; idx < x.length; idx++) {
      ret = ret * 256n;
      ret = ret + BigInt(x[idx]);
    }
    return ret;
  }

  for (var idx = 0; idx < proverPrivkeys.length; idx++) {
    const proverPrivkey = proverPrivkeys[idx];
    const proverPubkey = Point.fromPrivateKey(proverPrivkey);
    const msg = "zk-airdrop";
    const msghash_bigint = Uint8Array_to_bigint(keccak256(msg)); // Needs to be basicaly some public random hardcoded value
    const msghash = bigint_to_Uint8Array(msghash_bigint);
    const sig = await sign(msghash, bigint_to_Uint8Array(proverPrivkey), {
      canonical: true,
      der: false,
    });
    const r = sig.slice(0, 32);
    const s = sig.slice(32, 64);
    var r_bigint = Uint8Array_to_bigint(r);
    var s_bigint = Uint8Array_to_bigint(s);
    var r_array = bigint_to_array(86, 3, r_bigint);
    var s_array = bigint_to_array(86, 3, s_bigint);
    var msghash_array = bigint_to_array(86, 3, msghash_bigint);
    test_cases.push([proverPrivkey, msghash_bigint, sig, proverPubkey.x, proverPubkey.y]);
    console.log("proverPubkey x", proverPubkey.x);
    console.log("proverPubkey y", proverPubkey.y);
    console.log("s", s_bigint);
    console.log("s", s_array);
    console.log("the thing", bigint_to_array(86, 3, 57896044618658097711785492504343953926418782139537452191302581570759080747168n));

    // Get address from public key: https://ethereum.stackexchange.com/questions/29476/generating-an-address-from-a-public-key
    // let fullproverPubkey = keccak256(proverPubkey.x.toString() + proverPubkey.y.toString());
    // TODO: doesnt check out

    const proverWallet = new ethers.Wallet(proverPrivkey);
    const claimerWallet = new ethers.Wallet(claimerPrivkeys[idx]);
    const claimerHexAddress = claimerWallet.address.slice(2, proverWallet.address.length);
    console.log("Private key: ", proverPrivkey);

    // Generate merkle tree and path
    const tree = new MerkleTree(20, [], { hashFunction: mimcfs.mimcHash(123) });

    const mimc = mimcfs.mimcHash(123)(r_array[0], r_array[1], r_array[2], s_array[0], s_array[1], s_array[2]);
    // const pedersenHash = (data) =>
    //   circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];
    const nullifierHash = mimc;

    const treeLeaf = mimcfs.mimcHash(123)(BigInt(proverWallet.address));
    console.log("treeLeaf", treeLeaf);
    tree.insert(treeLeaf);
    console.log("claimerHexAddress", claimerHexAddress);
    console.log("nullifierHash", nullifierHash);

    const { pathElements, pathIndices } = tree.path(0);
    console.log("pathElements", pathElements);
    console.log("pathIndices", pathIndices);
    const mimcleaves = mimcfs.mimcHash(123)(treeLeaf, BigInt(pathElements[0]));
    console.log("mimcleaves", mimcleaves);
    // for (const sister in pathElements) {
    //   pathElements[sister] = intToHex(pathElements[sister]);
    // }
    console.log("root", tree.root());
    console.log("_layers", tree._layers);
    console.log("msghash", msghash);

    const json = JSON.stringify(
      {
        root: tree.root(),
        r: r_array.map((x) => x.toString()),
        s: s_array.map((x) => x.toString()),
        msghash: msghash_array.map((x) => x.toString()),
        pubkey: [bigint_to_tuple(proverPubkey.x).map((x) => x.toString()), bigint_to_tuple(proverPubkey.y).map((x) => x.toString())],
        pathElements: pathElements,
        pathIndices: pathIndices,
        publicClaimerAddress: hexStringToBigInt(claimerHexAddress).toString(10),
        privateClaimerAddress: hexStringToBigInt(claimerHexAddress).toString(10),
        nullifierHash: nullifierHash.toString(),
      },
      null,
      "\t"
    );
    console.log(json);
    fs.writeFile("circuits/airdrop/inputs/input_" + idx.toString() + ".json", json, "utf8", () => {});
  }
}

generateTestCases();
