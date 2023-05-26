// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

import "./SimpleERC6551Account.sol";

// Compose SimpleERC6551Account with ERC721Holder
// This gives us a TokenBoundAccount that can have ERC721 tokens
// directly minted to.
contract DudeAccount is ERC721Holder, SimpleERC6551Account {}
