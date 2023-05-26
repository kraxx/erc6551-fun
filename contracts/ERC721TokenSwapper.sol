// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Experimental middleware that provides trusted token swapping functionality.
abstract contract ERC721TokenSwapper is ERC721 {
    // Only swaps tokens if both are approved for the other.
    function swapTokens(address _acct1, address _acct2, uint256 _tokenId1, uint256 _tokenId2) public {
        require(getApproved(_tokenId1) == _acct2, "Token not approved for swap");
        require(getApproved(_tokenId2) == _acct1, "Token not approved for swap");

        _safeTransfer(_acct1, _acct2, _tokenId1, "");
        _safeTransfer(_acct2, _acct1, _tokenId2, "");
    }
}
