import MerkleTree from "fixed-merkle-tree";
import { mimcHash } from "./mimc";

const merkleTreeLevels = 10;

export const getPath = address => {
  const hashedLeaves = merkleTreeLeaves.map(leaf => mimcHash(1)(leaf));
  const merkleTree = new MerkleTree(merkleTreeLevels, hashedLeaves, { hashFunction: mimcHash(0) });
  let index = merkleTreeLeaves.findIndex(leaf => leaf === address.toLowerCase());
  if(index < 0) return null;
  const { pathElements, pathIndices } = merkleTree.path(index);
  return [merkleTree.root(), pathElements, pathIndices];
};

export const isEligible = address => {
  console.log("isEligible", address);
  return !!merkleTreeLeaves.find(leaf => leaf === address.toLowerCase());
};

const merkleTreeLeaves = [
    "0xf05b5f04b7a77ca549c0de06beaf257f40c66fdb",
    "0xe4edb4c1696019589249acf483da341a89c9d961",
    "0x46a768c40e8675d472a2443094d81300048e2fa9",
    "0xdd7a79b1b6e8dd444f99d68a7d493a85556944a2",
    "0x35e61b11f1c05271b9369e324d6b4305f6acb639",
    "0xea23c259b637f72d80697d4a4d1302df9f64530b",
    "0xeaf1f3559f6ab971846af124a75d970cb76d5228",
    "0xc5cd017ce8efd2fefedf114350657394531477ae",
    "0x39eBFC8eD680b6974F94192f23215584D9566bE7",
    "0xDD2572B62E32912c08a69821E5a68217bCe13522",
    "0x5aDF59ba7049D82B5a5D05373A4B27E62b43B30B",
    "0x52655b3a3b1a7548363ca9b3af2a9bbea3b67503",
    "0x926b47c42ce6bc92242c080cf8fafed34a164017",
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    "0xffaa22b8c5db1a7fbcf0005980fce67f1ad654f5",
    "0xc2d8cfcb9a7646496e4534c315fb53dcac55061f",
    "0xbb483e8976cd690ac5f1e82bcc1f3a32012ccc97",
    "0xa812c854be9e3558b4f5fdcc83eb3c9f53c27b23"
];
