// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Experimental contract that restricts an ERC721 implementation to only allow one token per owner.
abstract contract ERC721LimitPerOwner is ERC721 {
    uint256 private limit = 1;

    constructor(uint256 _limit) {
        limit = _limit;
    }

    // Applied to all ERC721 transfers
    function _beforeTokenTransfer(address, address to, uint256, uint256) internal virtual override {
        require(
            balanceOf(to) < limit,
            "Account's token limit reached"
        );
    }
}
