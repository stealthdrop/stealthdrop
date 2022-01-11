pragma solidity >=0.6.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "./wordlinesVerifier.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract WordLinesToken is Verifier, ERC721, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor() public ERC721("WordLinesToken", "WLT") {
    _setBaseURI("https://ipfs.io/ipfs/");
  }

  mapping(bytes32 => string) public inputToTokenURI;
  mapping(address => mapping(string => bool)) public claimedTokenURIs;

  function getHash(uint[92] memory input) public pure returns (bytes32) {
    uint[] memory copy = new uint[](91);
    for (uint i = 0;i < 91;i++) copy[i] = input[i];
    return keccak256(abi.encodePacked(copy));
  }

  function mintItem(
          address to,
          uint[2] memory a,
          uint[2][2] memory b,
          uint[2] memory c,
          uint[92] memory input
      ) public
      returns (uint256)
  {
      uint256 addr = uint256(to);
      bytes32 inputHash = getHash(input);
      require(input[91] == addr, "Address does not match zk input address");
      string memory tokenURI = inputToTokenURI[inputHash];
      require(bytes(tokenURI).length != 0, "Invalid token URI");
      require(claimedTokenURIs[to][tokenURI] != true, "Already claimed token URI");
      require(verifyProof(a, b, c, input), "Invalid Proof");
      
      _tokenIds.increment();
      uint256 id = _tokenIds.current();
      _mint(to, id);
      _setTokenURI(id, tokenURI);
      claimedTokenURIs[to][tokenURI] = true;

      return id;
  }

  function addToken(
          string memory tokenURI,
          uint[92] memory input
    ) public onlyOwner
    returns (bool)
  {
    inputToTokenURI[getHash(input)] = tokenURI;
    return true;
  }

}
