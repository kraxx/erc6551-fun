import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("E2E", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function setupAndUtils() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    const DudeToken = await ethers.getContractFactory("DudeToken");
    const dudeToken = await DudeToken.deploy();

    const HatToken = await ethers.getContractFactory("HatToken");
    const hatToken = await HatToken.deploy();

    const Registry = await ethers.getContractFactory("ERC6551Registry");
    const registry = await Registry.deploy();

    const Account = await ethers.getContractFactory("DudeAccount");
    const implementation = await Account.deploy();

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    // Question: why does passing any data cause an error when the implementation is our SimpleERC6551Account?
    // It passes when we use some fake implementation, such as 0xbebebebebebebebebebebebebebebebebebebebe.
    const initData = "0x";

    return {
      dudeToken, hatToken, registry, implementation,
      chainId, salt, initData,
      owner, alice, bob
    };
  }

  describe("Deployment", function () {
    it("Should deploy all contracts, and deploy a Token Bound Account for a Dude NFT", async function () {
      const { dudeToken, registry, implementation, alice, chainId, salt, initData } = await loadFixture(setupAndUtils);
;
      const tokenId = 0;

      // Mint NFT
      await dudeToken.mintDude(alice.address, "Alice's Dude");

      // Create TokenBoundAccount for NFT
      const tx = await registry.createAccount(implementation.address, chainId, dudeToken.address, tokenId, salt, initData);
      // Calculate Address for Account
      const tbaAddress = await registry.account(implementation.address, chainId, dudeToken.address, tokenId, salt);
      // Assert event emitted with the correct address
      await expect(tx).to.emit(registry, "AccountCreated").withArgs(tbaAddress, implementation.address, chainId, dudeToken.address, tokenId, salt);
      // Assert actual creation
      expect(await ethers.provider.getCode(tbaAddress)).to.exist;

      // Assert Alice owns the TokenBoundAccount
      const tokenBoundAccount = await implementation.attach(tbaAddress);
      expect(await tokenBoundAccount.owner()).to.equal(alice.address);

      // Assert token details of the TokenBoundAccount
      const tokenData = await tokenBoundAccount.token();
      expect(tokenData[0]).to.equal(chainId);
      expect(tokenData[1]).to.equal(dudeToken.address);
      expect(tokenData[2]).to.equal(tokenId);

      // Assert interface support
      expect(await tokenBoundAccount.supportsInterface("0x400a0398")).to.equal(true);
    });
  });

  describe("Alice's Dude", function () {
    async function mintDudeAndCreateTokenBoundAccount() {
      const {
        dudeToken, hatToken, registry, implementation,
        chainId, salt, initData,
        owner, alice, bob
      } = await loadFixture(setupAndUtils);

      const aliceDudeTokenId = 0;
      const aliceDudeTokenName = "Alice's Dude";

      // Mint NFT
      await dudeToken.mintDude(alice.address, aliceDudeTokenName);

      // Create TokenBoundAccount for NFT
      const tx = await registry.createAccount(implementation.address, chainId, dudeToken.address, aliceDudeTokenId, salt, initData);
      // Calculate Address for Account
      const aliceDudeTokenBoundAccountAddress = await registry.account(implementation.address, chainId, dudeToken.address, aliceDudeTokenId, salt);
      const aliceDudeTokenBoundAccount = await implementation.attach(aliceDudeTokenBoundAccountAddress);

      return {
        dudeToken, hatToken, registry, implementation,
        chainId, salt, initData,
        owner, alice, bob,
        aliceDudeTokenId, aliceDudeTokenName, aliceDudeTokenBoundAccount
      };
    }

    it("Mint Hat directly to Dude's account", async function () {
      const {
        hatToken, aliceDudeTokenBoundAccount
      } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

      // Mint Hat directly to Dude
      await hatToken.mint(aliceDudeTokenBoundAccount.address, "Alice's Dude's Hat");
      expect(await hatToken.ownerOf(0)).to.equal(aliceDudeTokenBoundAccount.address);
    });

    it("Mint Hat to OG owner, then transfer to Dude's account", async function () {
      const {
        dudeToken, hatToken, registry, implementation,
        chainId, salt, initData,
        owner, alice, bob,
        aliceDudeTokenId, aliceDudeTokenName, aliceDudeTokenBoundAccount
      } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

      // Mint Hat directly to owner first
      await hatToken.mint(owner.address, "");
      await hatToken.transferFrom(owner.address, aliceDudeTokenBoundAccount.address, 0);
      expect(await hatToken.ownerOf(0)).to.equal(aliceDudeTokenBoundAccount.address);
    });
  });
});
