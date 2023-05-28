import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DudeAccount", function () {
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

  describe("Alice's Dude and his Hat", function () {
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
        hatToken, owner, aliceDudeTokenBoundAccount
      } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

      // Mint Hat directly to owner first
      await hatToken.mint(owner.address, "");
      await hatToken.transferFrom(owner.address, aliceDudeTokenBoundAccount.address, 0);
      expect(await hatToken.ownerOf(0)).to.equal(aliceDudeTokenBoundAccount.address);
    });

    it("Alice gives her Dude to Bob", async function () {
      const {
        dudeToken, hatToken, alice, bob,
        aliceDudeTokenId, aliceDudeTokenBoundAccount
      } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

      const hatTokenId = 0;

      // Mint Hat directly to Dude
      await hatToken.mint(aliceDudeTokenBoundAccount.address, "Alice's Dude's Hat");
      expect(await hatToken.ownerOf(hatTokenId)).to.equal(aliceDudeTokenBoundAccount.address);

      // Alice gives her Dude to Bob
      await dudeToken.connect(alice).transferFrom(alice.address, bob.address, aliceDudeTokenId);
      // Bob now owns the Dude, and the Dude still owns the Hat.
      expect(await dudeToken.ownerOf(aliceDudeTokenId)).to.equal(bob.address);
      expect(await hatToken.ownerOf(hatTokenId)).to.equal(aliceDudeTokenBoundAccount.address);
    });

    it("Alice's Dude gives its hat to Bob's Dude", async function () {
      const {
        dudeToken, hatToken, registry, implementation,
        chainId, salt, initData, alice, bob, aliceDudeTokenBoundAccount
      } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

      const hatTokenId = 0;

      // Mint Hat directly to Dude
      await hatToken.mint(aliceDudeTokenBoundAccount.address, "Alice's Dude's Hat");
      expect(await hatToken.ownerOf(hatTokenId)).to.equal(aliceDudeTokenBoundAccount.address);

      const bobDudeTokenId = 1;
      await dudeToken.mintDude(bob.address, "Bob's Dude");

      // Bob's Dude creates a TokenBoundAccount for itself
      await registry.createAccount(implementation.address, chainId, dudeToken.address, bobDudeTokenId, salt, initData);
      const bobDudeTokenBoundAccountAddress = await registry.account(implementation.address, chainId, dudeToken.address, bobDudeTokenId, salt);
      const bobDudeTokenBoundAccount = await implementation.attach(bobDudeTokenBoundAccountAddress);
      expect(await bobDudeTokenBoundAccount.owner()).to.equal(bob.address);

      // Alice's Dude's Hat is transferred to Bob's Dude.
      // We must use executeCall here, because only Alice can sign transactions.
      await aliceDudeTokenBoundAccount.connect(alice).executeCall(
        hatToken.address, 0, hatToken.interface.encodeFunctionData(
            "transferFrom", [aliceDudeTokenBoundAccount.address, bobDudeTokenBoundAccount.address, hatTokenId]
          )
      );
      expect(await hatToken.balanceOf(aliceDudeTokenBoundAccount.address)).to.equal(0);
      expect(await hatToken.balanceOf(bobDudeTokenBoundAccount.address)).to.equal(1);
      expect(await hatToken.ownerOf(hatTokenId)).to.equal(bobDudeTokenBoundAccount.address);
    });

    it("Alice's Dude gives its hat to Bob's Dude, then mints another Hat, and finally swaps with Bob's Dude to get his Hat back", async function () {
      const {
        dudeToken, hatToken, registry, implementation,
        chainId, salt, initData, alice, bob, aliceDudeTokenBoundAccount
      } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

      const hatTokenId = 0;

      // Mint Hat directly to Dude
      await hatToken.mint(aliceDudeTokenBoundAccount.address, "Alice's Dude's Hat");
      expect(await hatToken.ownerOf(hatTokenId)).to.equal(aliceDudeTokenBoundAccount.address);

      const bobDudeTokenId = 1;
      await dudeToken.mintDude(bob.address, "Bob's Dude");

      // Bob's Dude creates a TokenBoundAccount for itself
      await registry.createAccount(implementation.address, chainId, dudeToken.address, bobDudeTokenId, salt, initData);
      const bobDudeTokenBoundAccountAddress = await registry.account(implementation.address, chainId, dudeToken.address, bobDudeTokenId, salt);
      const bobDudeTokenBoundAccount = await implementation.attach(bobDudeTokenBoundAccountAddress);
      expect(await bobDudeTokenBoundAccount.owner()).to.equal(bob.address);

      // Alice's Dude's Hat is transferred to Bob's Dude.
      await aliceDudeTokenBoundAccount.connect(alice).executeCall(
        hatToken.address, 0, hatToken.interface.encodeFunctionData(
          "transferFrom", [aliceDudeTokenBoundAccount.address, bobDudeTokenBoundAccount.address, hatTokenId]
        )
      );
      expect(await hatToken.ownerOf(hatTokenId)).to.equal(bobDudeTokenBoundAccount.address);

      // Alice's Dude mints a second Hat.
      const hatTokenId_2 = 1;
      await hatToken.mint(aliceDudeTokenBoundAccount.address, "Alice's Dude's Second Hat");
      expect(await hatToken.ownerOf(hatTokenId_2)).to.equal(aliceDudeTokenBoundAccount.address);

      // Alice's Dude swaps its second Hat with Bob's Dude.
      // Approvals must first be made.
      let tx = await aliceDudeTokenBoundAccount.connect(alice).executeCall(
        hatToken.address, 0, hatToken.interface.encodeFunctionData(
          "approve", [bobDudeTokenBoundAccount.address, hatTokenId_2]
        )
      );
      await expect(tx).to.emit(hatToken, "Approval").withArgs(aliceDudeTokenBoundAccount.address, bobDudeTokenBoundAccount.address, hatTokenId_2);
      // Approvals must first be made.
      tx = await bobDudeTokenBoundAccount.connect(bob).executeCall(
        hatToken.address, 0, hatToken.interface.encodeFunctionData(
          "approve", [aliceDudeTokenBoundAccount.address, hatTokenId]
        )
      );
      await expect(tx).to.emit(hatToken, "Approval").withArgs(bobDudeTokenBoundAccount.address, aliceDudeTokenBoundAccount.address, hatTokenId);

      // Swap the Hats. Anybody can do this so long as they have the approvals.
      await hatToken.swapTokens(aliceDudeTokenBoundAccount.address, bobDudeTokenBoundAccount.address, hatTokenId_2, hatTokenId);
      // Check that all is right with the world (of Hats).
      expect(await hatToken.ownerOf(hatTokenId)).to.equal(aliceDudeTokenBoundAccount.address);
      expect(await hatToken.ownerOf(hatTokenId_2)).to.equal(bobDudeTokenBoundAccount.address);
    });

    describe("Weird Scenarios", function () {
      it("Dude can own another Dude", async function () {
        const {
          dudeToken, alice, aliceDudeTokenId, aliceDudeTokenBoundAccount
        } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

        const dudeTokenId_2 = 1;

        // Mint another dude to Alice's Dude
        await dudeToken.mintDude(aliceDudeTokenBoundAccount.address, "Alice's Dude's Dude");
        expect(await dudeToken.ownerOf(dudeTokenId_2)).to.equal(aliceDudeTokenBoundAccount.address);
        expect(await dudeToken.ownerOf(aliceDudeTokenId)).to.equal(alice.address);
      });

      it("Dude can own another Dude and transfer it to an EOA", async function () {
        const {
          dudeToken, alice, bob, aliceDudeTokenId, aliceDudeTokenBoundAccount
        } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

        const dudeTokenId_2 = 1;

        // Mint another dude to Alice's Dude
        await dudeToken.mintDude(aliceDudeTokenBoundAccount.address, "Alice's Dude's Dude");

        // Transfer Alice's Dude's Dude to Bob
        await aliceDudeTokenBoundAccount.connect(alice).executeCall(
          dudeToken.address, 0, dudeToken.interface.encodeFunctionData(
            "transferFrom", [aliceDudeTokenBoundAccount.address, bob.address, dudeTokenId_2]
          )
        );
        expect(await dudeToken.ownerOf(dudeTokenId_2)).to.equal(bob.address);
        expect(await dudeToken.ownerOf(aliceDudeTokenId)).to.equal(alice.address);
      });

      it("Hat ownership, 2 layers deep", async function () {
        const {
          dudeToken, hatToken, registry, implementation,
          chainId, salt, initData,  alice,
          aliceDudeTokenId, aliceDudeTokenBoundAccount
        } = await loadFixture(mintDudeAndCreateTokenBoundAccount);

        const dudeTokenId_2 = 1;

        // Mint another dude to Alice's Dude
        await dudeToken.mintDude(aliceDudeTokenBoundAccount.address, "Alice's Dude's Dude");
        // Dude 2 needs an account to own a Hat
        await registry.createAccount(implementation.address, chainId, dudeToken.address, dudeTokenId_2, salt, initData);
        const tokenBoundAccountAddress_2 = await registry.account(implementation.address, chainId, dudeToken.address, dudeTokenId_2, salt);
        const tokenBoundAccount_2 = await implementation.attach(tokenBoundAccountAddress_2);

        // Mint a Hat to Dude's Dude
        const hatTokenId = 0;
        await hatToken.mint(tokenBoundAccount_2.address, "Alice's Dude's Dude's Hat");

        // Transfer Alice's Dude's Dude's Hat to Alice.
        // We have to do 2 nested executeCalls because the Hat is owned by a TokenBoundAccount, owned by yet another TokenBoundAccount.
        await aliceDudeTokenBoundAccount.connect(alice).executeCall(
          tokenBoundAccount_2.address, 0, tokenBoundAccount_2.interface.encodeFunctionData(
            "executeCall", [hatToken.address, 0, hatToken.interface.encodeFunctionData(
              "transferFrom", [tokenBoundAccount_2.address, alice.address, hatTokenId]
            )]
          )
        );

        // Check all ownerships in this chaos.
        expect(await hatToken.ownerOf(hatTokenId)).to.equal(alice.address);
        expect(await dudeToken.ownerOf(aliceDudeTokenId)).to.equal(alice.address);
        expect(await dudeToken.ownerOf(dudeTokenId_2)).to.equal(aliceDudeTokenBoundAccount.address);
        // Check all balances too.
        expect(await dudeToken.balanceOf(alice.address)).to.equal(1);
        expect(await dudeToken.balanceOf(aliceDudeTokenBoundAccount.address)).to.equal(1);
        expect(await dudeToken.balanceOf(tokenBoundAccount_2.address)).to.equal(0);
        expect(await hatToken.balanceOf(alice.address)).to.equal(1);
        expect(await hatToken.balanceOf(aliceDudeTokenBoundAccount.address)).to.equal(0);
        expect(await hatToken.balanceOf(tokenBoundAccount_2.address)).to.equal(0);
      });
    });
  });
});
