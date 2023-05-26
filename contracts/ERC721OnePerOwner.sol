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

    function transferFrom(address from, address to, uint256 tokenId) public virtual override onePerOwner(to) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override onePerOwner(to) {
        super.safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override onePerOwner(to) {
        super._safeTransfer(from, to, tokenId, data);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual override onePerOwner(to){
        super._safeTransfer(from, to, tokenId, data);
    }

    function _safeMint(address to, uint256 tokenId) internal virtual override onePerOwner(to) {
        super._safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual override onePerOwner(to) {
        super._safeMint(to, tokenId, data);
    }

    function _mint(address to, uint256 tokenId) internal virtual override onePerOwner(to) {
        super._mint(to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal virtual override onePerOwner(to) {
        super._transfer(from, to, tokenId);
    }

    // NOTE: might only need this.
    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize) internal virtual override onePerOwner(to) {}
}
