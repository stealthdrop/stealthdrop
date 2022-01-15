pragma solidity >=0.6.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "./wordlinesVerifier.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Largely inspired by https://github.com/Uniswap/merkle-distributor/blob/master/contracts/interfaces/IMerkleDistributor.sol
contract ZKT is ERC20, Verifier {
    uint256 public merkleRoot;
    mapping(uint256 => bool) public claimedNullifiers;

    event Claim(address indexed claimant, uint256 amount);

    /**
     * @dev Constructor.
     * @param freeSupply The number of tokens to issue to the contract deployer.
     * @param airdropSupply The number of tokens to reserve for the airdrop.
     * @param _merkleRoot Merkle Root of the Airdrop addresses.
     */
    constructor(
        uint256 freeSupply,
        uint256 airdropSupply,
        uint256 _merkleRoot
    )
        public
        ERC20("Zero Knowledge Token", "ZKT")
    {
        _mint(msg.sender, freeSupply);
        _mint(address(this), airdropSupply);
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev Claims airdropped tokens.
     * @param a ZK merkle proof alpha proving the claim is valid.
     * @param b ZK merkle proof beta proving the claim is valid.
     * @param c ZK merkle proof charlie proving the claim is valid.
     * @param signals ZK merkle proof signals proving the claim is valid.
     */
    function claimTokens(
          uint[2] memory a,
          uint[2][2] memory b,
          uint[2] memory c,
          uint[4] memory signals) external {
        // TODO indices
        require(!claimedNullifiers[signals[0]], "Nullifier has already been claimed");
        require(signals[1] == merkleRoot, "Merkle Root does not match contract");
        console.log(uint256(msg.sender));
        require(signals[2] == uint256(msg.sender), "Sender address does not match zk input sender address");
        require(signals[3] == "msghash", "Message hash invalid"); // TODO 
        require(verifyProof(a, b, c, signals), "Invalid Proof");
        claimedNullifiers[signals[0]] = true;
        emit Claim(msg.sender, 10**decimals);
        _transfer(address(this), msg.sender, 10**decimals);
    }
}
