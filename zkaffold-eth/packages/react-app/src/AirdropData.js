import MerkleTree from "fixed-merkle-tree";
import { mimcHash } from "./mimc";

export const merkleTreeRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";

const merkleTreeLevels = 4;

export const getPath = address => {
  const hashedLeaves = merkleTreeLeaves.map(leaf => mimcHash(1)(leaf));
  const merkleTree = new MerkleTree(merkleTreeLevels, hashedLeaves, { hashFunction: mimcHash(0) });
  let index = merkleTreeLeaves.findIndex(leaf => leaf === address);
  if(index < 0) return null;
  const { pathElements, pathIndex } = merkleTree.path(index);
  return [pathElements, pathIndex];
};

export const isEligible = address => {
  console.log("isEligible", address);
  return !!merkleTreeLeaves.find(leaf => leaf === address);
};

const merkleTreeLeaves = [
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
  "0xc2D8cFCB9A7646496e4534c315FB53DCaC55061F",
];
