# ERC6551 Fun

Nothing special here, I'm just playing around with Solidity + Hardhat.

# Contracts

The following contracts (and associated libs) were copied from the [ERC6551 reference repo](https://github.com/erc6551/reference):
- ERC6551Registry
- SimpleERC6551Account

## DudeToken
Just a standard ERC721. Dudes get minted with a `name`.

## ERC721TokenSwapper
Exposes `swapTokens(addr1, addr2, token1, token2)`, which allows us to swap tokens between 2 contracts in 1 transaction.
This is needed because of the next contract. Inherits from openzeppelin's `ERC721` implementation.

## ERC721LimitPerOwner
Limits the number of tokens that can be owned by a single account. Though I don't see real value brought by this limitation, it can be used to impose rules on game-specific tokens. Inherits from `ERC721TokenSwapper`, which allows us to swap tokens without needing a third account.

## HatToken
A special ERC721 composed with `ERC721TokenSwapper` & `ERC721LimitPerOwner(1)`. An account can only hold at max 1 Hat. How special these are! Better pick your one and only favourite hat to wear.

## DudeAccount
Token Bound Account meant for `DudeTokens`. Inherits from `SimpleERC6551Account` & `ERC721Holder`. The latter allows for minting directly to the account.

# Testing
The core of the Token Bound Account functionality is tested in the scenarios laid on in [test/DudeAccount.ts](test/DudeAccount.ts).

## Instructions
Install dependencies using `npm` (or `yarn`).

Compile contracts with `npx hardhat compile`.

Run unit tests with `npx hardhat test`.

Deploy to a test network with `npx hardhat run scripts/deploy.js`. If you don't want to mess with deploying to a third party testnet, just run your own with `npx hardhat node`.