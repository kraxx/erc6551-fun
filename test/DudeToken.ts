import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DudeToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployDudeToken() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    const DudeToken = await ethers.getContractFactory("DudeToken");
    const dudeToken = await DudeToken.deploy();

    return { dudeToken, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("Should set the token name and symbol", async function () {
      const { dudeToken, owner } = await loadFixture(deployDudeToken);

      expect(await dudeToken.owner()).to.equal(owner.address);
      expect(await dudeToken.name()).to.equal("DudeToken");
      expect(await dudeToken.symbol()).to.equal("DUDE");
    });
  });

  describe("Minting", function () {
    it("Should mint tokens with given name", async function () {
      const { dudeToken, alice } = await loadFixture(deployDudeToken);
      let name = "Alice's Dude";

      let tx = await dudeToken.mintDude(alice.address, name);
      expect(await dudeToken.balanceOf(alice.address)).to.equal(1);
      expect(await dudeToken.ownerOf(0)).to.equal(alice.address);
      await expect(tx).to.emit(dudeToken, "Minted").withArgs(alice.address, 0, name);

      // mint a second one
      name = "Second Dude";
      tx = await dudeToken.mintDude(alice.address, name);
      expect(await dudeToken.balanceOf(alice.address)).to.equal(2);
      expect(await dudeToken.ownerOf(1)).to.equal(alice.address);
      await expect(tx).to.emit(dudeToken, "Minted").withArgs(alice.address, 1, name);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const { dudeToken, alice } = await loadFixture(deployDudeToken);

      await expect(dudeToken.connect(alice).mintDude(alice.address, "Alice's Dude"))
        .to.be.revertedWith("Ownable: caller is not the owner");
      expect(await dudeToken.balanceOf(alice.address)).to.equal(0);
    });

    it("Should mint with default name on not providing name", async function () {
      const { dudeToken, owner } = await loadFixture(deployDudeToken);
      const tokenId = 0;

      const tx = await dudeToken.mintDude(owner.address, "");
      expect((await dudeToken.dudes(tokenId)).name).to.equal("Unnamed generic dude");
    });
  });

  describe("Transfers", function () {
    it("Should transfer token from one account to another", async function () {
      const { dudeToken, alice, bob } = await loadFixture(deployDudeToken);
      const name = "Alice's Dude";
      const tokenId = 0;

      await dudeToken.mintDude(alice.address, name);
      const tx = dudeToken.connect(alice).transferFrom(alice.address, bob.address, tokenId);
      await expect(tx).to.emit(dudeToken, "Transfer").withArgs(alice.address, bob.address, tokenId);

      expect(await dudeToken.balanceOf(alice.address)).to.equal(0);
      expect(await dudeToken.balanceOf(bob.address)).to.equal(1);
      expect(await dudeToken.ownerOf(tokenId)).to.equal(bob.address);
      expect((await dudeToken.dudes(tokenId)).name).to.equal(name);
    });

    it("Should transfer token from one account to another using approval method", async function () {
      const { dudeToken, alice, bob } = await loadFixture(deployDudeToken);
      const name = "Alice's Dude";
      const tokenId = 0;

      await dudeToken.mintDude(alice.address, name);
      let tx = dudeToken.connect(alice).approve(bob.address, tokenId);
      await expect(tx).to.emit(dudeToken, "Approval").withArgs(alice.address, bob.address, tokenId);

      // Bob can now transfer the token
      tx = await dudeToken.connect(bob).transferFrom(alice.address, bob.address, tokenId);
      await expect(tx).to.emit(dudeToken, "Transfer").withArgs(alice.address, bob.address, tokenId);

      expect(await dudeToken.balanceOf(alice.address)).to.equal(0);
      expect(await dudeToken.balanceOf(bob.address)).to.equal(1);
      expect(await dudeToken.ownerOf(tokenId)).to.equal(bob.address);
      expect((await dudeToken.dudes(tokenId)).name).to.equal(name);
    });

    it("Should fail to transfer token if not sent from owner", async function () {
      const { dudeToken, alice, bob } = await loadFixture(deployDudeToken);
      const name = "Alice's Dude";
      const tokenId = 0;

      await dudeToken.mintDude(alice.address, name);
      await expect(dudeToken.transferFrom(alice.address, bob.address, tokenId))
        .to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should fail to transfer token if token doesn't exist", async function () {
      const { dudeToken, alice, bob } = await loadFixture(deployDudeToken);
      const tokenId = 0;

      await expect(dudeToken.connect(alice).transferFrom(alice.address, bob.address, tokenId))
        .to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should fail to transfer token if token doesn't exist", async function () {
      const { dudeToken, alice, bob } = await loadFixture(deployDudeToken);
      const tokenId = 0;

      await expect(dudeToken.connect(alice).transferFrom(alice.address, bob.address, tokenId))
        .to.be.revertedWith("ERC721: invalid token ID");
    });

    describe("Burn", function () {
      it("Cannot burn token", async function () {
        const { dudeToken, owner } = await loadFixture(deployDudeToken);
        const tokenId = 0;

        await dudeToken.mintDude(owner.address, "");
        await expect(dudeToken.transferFrom(owner.address, ethers.constants.AddressZero, tokenId))
          .to.be.revertedWith("ERC721: transfer to the zero address");
      });
    });
  });
});
