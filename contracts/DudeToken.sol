// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DudeToken is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct Dude {
        uint256 id;
        string name;
    }

    Dude[] dudes;

    event Minted(address indexed to, uint256 indexed tokenId, string name);

    constructor() ERC721("DudeToken", "DUDE") {}

    function mintDude(address _to, string memory _name) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);

        if (bytes(_name).length == 0) {
            _name = "Unnamed generic dude";
        }

        dudes.push(Dude(tokenId, _name));
        emit Minted(_to, tokenId, _name);
    }
}