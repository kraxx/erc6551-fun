import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("E2E", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAll() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    const DudeToken = await ethers.getContractFactory("DudeToken");
    const dudeToken = await DudeToken.deploy();

    const Registry = await ethers.getContractFactory("ERC6551Registry");
    const registry = await Registry.deploy();

    const Account = await ethers.getContractFactory("SimpleERC6551Account");
    const tokenAccount = await Account.deploy();

    return { dudeToken, registry, tokenAccount, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("Should deploy all contracts", async function () {
      const { dudeToken, registry, tokenAccount, owner, alice } = await loadFixture(deployAll);

      const implementation = tokenAccount.address;
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const tokenId = 0;
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      // Question: why does passing any data cause an error when the implementation is our SimpleERC6551Account?
      // It passes when we use some fake implementation, such as 0xbebebebebebebebebebebebebebebebebebebebe.
      const initData = "0x";

      await dudeToken.mintDude(alice.address, "Alice's Dude");

      const tx = await registry.createAccount(implementation, chainId, dudeToken.address, tokenId, salt, initData);
      const createdAccount = await registry.account(implementation, chainId, dudeToken.address, tokenId, salt);
      await expect(tx).to.emit(registry, "AccountCreated").withArgs(createdAccount, implementation, chainId, dudeToken.address, tokenId, salt);
      expect(await ethers.provider.getCode(createdAccount)).to.exist;

      const dudeTokenAccount = await tokenAccount.attach(createdAccount);
      expect(await dudeTokenAccount.owner()).to.equal(alice.address);
    });
  });
});
