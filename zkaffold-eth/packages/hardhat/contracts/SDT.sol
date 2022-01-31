pragma solidity >=0.6.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "./airdropVerifier.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Largely inspired by https://github.com/Uniswap/merkle-distributor/blob/master/contracts/interfaces/IMerkleDistributor.sol
contract SDT is ERC20, Verifier {
    uint256 constant SNARK_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint256 public merkleRoot;
    mapping(uint256 => bool) public claimedNullifiers;
    uint256[3] public messageClaimHash;
    event Claim(address indexed claimant, uint256 amount);

    /**
     * @dev Constructor.
     * @param freeSupply The number of tokens to issue to the contract deployer.
     * @param airdropSupply The number of tokens to reserve for the airdrop.
     * @param _merkleRoot Merkle Root of the Airdrop addresses.
     * @param _messageClaimHash Claim message hash 
     */
    constructor(
        uint256 freeSupply,
        uint256 airdropSupply,
        uint256 _merkleRoot,
        uint256[3] memory _messageClaimHash
    ) public ERC20("StealthDrop Token", "SDT") {
        _mint(msg.sender, freeSupply);
        _mint(address(this), airdropSupply);
        merkleRoot = _merkleRoot;
        messageClaimHash = _messageClaimHash;
    }

    /**
     * @dev Claims airdropped tokens.
     * @param a ZK merkle proof alpha proving the claim is valid.
     * @param b ZK merkle proof beta proving the claim is valid.
     * @param c ZK merkle proof charlie proving the claim is valid.
     * @param signals ZK merkle proof signals proving the claim is valid.
     */
    function claimTokens(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[6] memory signals
    ) external {
        require(
            signals[0] == merkleRoot,
            "Merkle Root does not match contract"
        );

        require(
            !claimedNullifiers[signals[5]],
            "Nullifier has already been claimed"
        );
        require(uint256(signals[5]) < SNARK_FIELD ,"Nullifier is not within the field");
        claimedNullifiers[signals[5]] = true;

        for(uint i = 0;i < messageClaimHash.length;i++) {
            require(signals[i + 1] == messageClaimHash[i], "claim message hash does not match");
        }

        // require(verifyProof(a, b, c, signals), "Invalid Proof");
        
        emit Claim(address(uint160(signals[4])), 10**18);
        _transfer(address(this), address(uint160(signals[4])), 10**18);
        msg.sender.transfer(getChestQuota());
    }

    function getChestBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getChestQuota() public view returns (uint256) {
        return 10**18 * address(this).balance / balanceOf(address(this));
    }

    function depositChest(uint256 amount) payable public {
        require(msg.value == amount, "Suggested amount does not match value");
    }
}
