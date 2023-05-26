// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ERC721TokenSwapper.sol";

// Experimental middleware that restricts an ERC721 implementation to only allow one token per owner.
// Inherits from ERC721TokenSwapper, so we don't need to do weird 3-way token swaps.
// Because we want to use ERC721TokenSwapper's swap without a third address involved,
// we cannot simply use the _beforeTokenTransfer hook.
// This limiting is enforced only on public transfer functions, as well as all minting functions.
abstract contract ERC721LimitPerOwner is ERC721TokenSwapper {
    uint256 private limit = 1;

    constructor(uint256 _limit) {
        limit = _limit;
    }

     // Applied to all ERC721 transfers
    modifier limitPerOwner(address _account) {
        require(
            balanceOf(_account) < limit,
            "Account's token limit reached"
        );
        _;
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override limitPerOwner(to) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override limitPerOwner(to) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override limitPerOwner(to) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function _safeMint(address to, uint256 tokenId) internal virtual override limitPerOwner(to) {
        super._safeMint(to, tokenId);
    }

    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual override limitPerOwner(to) {
        super._safeMint(to, tokenId, data);
    }

    function _mint(address to, uint256 tokenId) internal virtual override limitPerOwner(to) {
        super._mint(to, tokenId);
    }
}
