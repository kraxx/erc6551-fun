// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Experimental contract that restricts an ERC721 implementation to only allow one token per owner.
abstract contract ERC721OnePerOwner is ERC721 {
    // Applied to all ERC721 transfers
    modifier onePerOwner(address _account) {
        require(
            balanceOf(_account) == 0,
            "Account already has a token, only one allowed"
        );
        _;
    }

    // NOTE: might only need this.
    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize) internal virtual override onePerOwner(to) {}
}
