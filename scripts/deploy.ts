import { ethers } from "hardhat";

async function main() {
  const DudeToken = await ethers.getContractFactory("DudeToken");
  const dudeToken = await DudeToken.deploy();
  await dudeToken.deployed();
  console.log(`DudeToken deployed to ${dudeToken.address}`);

  const HatToken = await ethers.getContractFactory("HatToken");
  const hatToken = await HatToken.deploy();
  await hatToken.deployed();
  console.log(`HatToken deployed to ${hatToken.address}`);

  const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
  const registry = await ERC6551Registry.deploy();
  await registry.deployed();
  console.log(`ERC6551Registry deployed to ${registry.address}`);

  const DudeAccount = await ethers.getContractFactory("DudeAccount");
  const dudeAccount = await DudeAccount.deploy();
  await dudeAccount.deployed();
  console.log(`DudeAccount deployed to ${dudeAccount.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
