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

    const Registry = await ethers.getContractFactory("ERC6551Registry");
    const registry = await Registry.deploy();

    const Account = await ethers.getContractFactory("SimpleERC6551Account");
    const implementation = await Account.deploy();

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    // Question: why does passing any data cause an error when the implementation is our SimpleERC6551Account?
    // It passes when we use some fake implementation, such as 0xbebebebebebebebebebebebebebebebebebebebe.
    const initData = "0x";

    return {
      dudeToken, registry, implementation,
      chainId, salt, initData,
      owner, alice, bob
    };
  }

  describe("Deployment", function () {
    it("Should deploy all contracts", async function () {
      const { dudeToken, registry, implementation, owner, alice, chainId, salt, initData } = await loadFixture(setupAndUtils);
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
});
