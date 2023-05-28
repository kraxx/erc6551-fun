import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("HatToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function setup() {
    const HatToken = await ethers.getContractFactory("HatToken");
    const hatToken = await HatToken.deploy();

    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    return { hatToken, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("should be owner by deployer", async function () {
      const { hatToken, owner } = await loadFixture(setup);

      expect(await hatToken.owner()).to.equal(owner.address);
    });

    it("should deploy with the correct name and token symbol", async function () {
      const { hatToken } = await loadFixture(setup);

      expect(await hatToken.name()).to.equal("HatToken");
      expect(await hatToken.symbol()).to.equal("HAT");
    });
  });

  describe("Minting", function () {
    it("should mint token with given name", async function () {
      const { hatToken, alice } = await loadFixture(setup);
      
      const name = "Fancy Hat";
      const tokenId = 0;

      const tx = await hatToken.mint(alice.address, name);
      expect(await hatToken.balanceOf(alice.address)).to.equal(1);
      expect(await hatToken.ownerOf(tokenId)).to.equal(alice.address);
      await expect(tx).to.emit(hatToken, "Minted").withArgs(alice.address, tokenId, name);
    });

    it("should revert if minted to account that already owns 1 token", async function () {
      const { hatToken, alice } = await loadFixture(setup);

      // Mint 1x
      await hatToken.mint(alice.address, "");
      // Mint 2x
      await expect(hatToken.mint(alice.address, ""))
        .to.be.revertedWith("Account's token limit reached");
    });
  });

  describe("Transfer", function () {
    it("should transfer to account that does not own a token", async function () {
      const { hatToken, alice, bob } = await loadFixture(setup);

      const tokenId = 0;

      await hatToken.mint(alice.address, "");
      const tx = await hatToken.connect(alice).transferFrom(alice.address, bob.address, tokenId);
      await expect(tx).to.emit(hatToken, "Transfer").withArgs(alice.address, bob.address, tokenId);

      expect(await hatToken.balanceOf(alice.address)).to.equal(0);
      expect(await hatToken.balanceOf(bob.address)).to.equal(1);
    });

    it("should revert if transferred to account that already owns 1 token", async function () {
      const { hatToken, alice, bob } = await loadFixture(setup);

      const aliceTokenId = 0;

      await hatToken.mint(alice.address, "");
      await hatToken.mint(bob.address, "");

      await expect(hatToken.connect(alice).transferFrom(alice.address, bob.address, aliceTokenId))
        .to.be.revertedWith("Account's token limit reached");
    });

    describe("Swap", function () {
      it("should swap tokens between two accounts", async function () {
        const { hatToken, alice, bob } = await loadFixture(setup);

        const aliceTokenId = 0;
        const bobTokenId = 1;

        await hatToken.mint(alice.address, "");
        await hatToken.mint(bob.address, "");

        await hatToken.connect(alice).approve(bob.address, aliceTokenId);
        await hatToken.connect(bob).approve(alice.address, bobTokenId);

        // Swap and assert
        const tx = await hatToken.connect(alice).swapTokens(alice.address, bob.address, aliceTokenId, bobTokenId);
        await expect(tx).to.emit(hatToken, "Transfer").withArgs(alice.address, bob.address, aliceTokenId);
        await expect(tx).to.emit(hatToken, "Transfer").withArgs(bob.address, alice.address, bobTokenId);

        expect(await hatToken.ownerOf(aliceTokenId)).to.equal(bob.address);
        expect(await hatToken.ownerOf(bobTokenId)).to.equal(alice.address);
      });

      it("should not swap if not both approved", async function () {
        const { hatToken, alice, bob } = await loadFixture(setup);

        const aliceTokenId = 0;
        const bobTokenId = 1;

        await hatToken.mint(alice.address, "");
        await hatToken.mint(bob.address, "");

        await hatToken.connect(alice).approve(bob.address, aliceTokenId);

        await expect(hatToken.swapTokens(alice.address, bob.address, aliceTokenId, bobTokenId))
          .to.be.revertedWith("Token not approved for swap");
      });

      it("should not swap if a token is missing", async function () {
        const { hatToken, alice, bob } = await loadFixture(setup);

        const aliceTokenId = 0;
        const bobTokenId = 1;

        await hatToken.mint(alice.address, "");

        await hatToken.connect(alice).approve(bob.address, aliceTokenId);

        await expect(hatToken.swapTokens(alice.address, bob.address, aliceTokenId, bobTokenId))
          .to.be.revertedWith("ERC721: invalid token ID");
      });
    });
  });
});
