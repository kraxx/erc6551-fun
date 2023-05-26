// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./ERC721LimitPerOwner.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// These hats are special. Only one per owner.
contract HatToken is ERC721LimitPerOwner, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct Hat {
        uint256 id;
        string name;
    }

    Hat[] public hats;

    event Minted(address indexed to, uint256 indexed tokenId, string name);

    constructor() ERC721LimitPerOwner(1) ERC721("HatToken", "HAT") {}

    function mint(address _to, string memory _name) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);

        if (bytes(_name).length == 0) {
            _name = "Boring hat";
        }

        hats.push(Hat(tokenId, _name));
        emit Minted(_to, tokenId, _name);
    }
}
