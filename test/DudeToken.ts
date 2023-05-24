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

      // const tx = await dudeToken.mintDude(alice.address, "Alice's Dude", { from: alice.address });
      await expect(
        dudeToken.connect(alice).mintDude(alice.address, "Alice's Dude"))
        .to.be.revertedWith("Ownable: caller is not the owner"
      );
      expect(await dudeToken.balanceOf(alice.address)).to.equal(0);
    });
  });

//   describe("Withdrawals", function () {
//     describe("Validations", function () {
//       it("Should revert with the right error if called too soon", async function () {
//         const { lock } = await loadFixture(deployOneYearLockFixture);

//         await expect(lock.withdraw()).to.be.revertedWith(
//           "You can't withdraw yet"
//         );
//       });

//       it("Should revert with the right error if called from another account", async function () {
//         const { lock, unlockTime, otherAccount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // We can increase the time in Hardhat Network
//         await time.increaseTo(unlockTime);

//         // We use lock.connect() to send a transaction from another account
//         await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
//           "You aren't the owner"
//         );
//       });

//       it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
//         const { lock, unlockTime } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         // Transactions are sent using the first signer by default
//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).not.to.be.reverted;
//       });
//     });

//     describe("Events", function () {
//       it("Should emit an event on withdrawals", async function () {
//         const { lock, unlockTime, lockedAmount } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw())
//           .to.emit(lock, "Withdrawal")
//           .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
//       });
//     });

//     describe("Transfers", function () {
//       it("Should transfer the funds to the owner", async function () {
//         const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
//           deployOneYearLockFixture
//         );

//         await time.increaseTo(unlockTime);

//         await expect(lock.withdraw()).to.changeEtherBalances(
//           [owner, lock],
//           [lockedAmount, -lockedAmount]
//         );
//       });
//     });
//   });
});
