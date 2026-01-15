import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying BlockhashGuessingGame...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const BlockhashGuessingGame = await ethers.getContractFactory("BlockhashGuessingGame");
  console.log("Deploying contract...");

  const game = await BlockhashGuessingGame.deploy();
  await game.waitForDeployment();

  const address = await game.getAddress();
  console.log("✅ BlockhashGuessingGame deployed to:", address);

  // Wait a moment for deployment to finalize
  console.log("\nWaiting for deployment to finalize...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Get initial game state
    const gameState = await game.getGameState();
    console.log("\n📊 Initial Game State:");
    console.log("  Current Round:", gameState.currentRound.toString());
    console.log("  Target Block Number:", gameState.targetBlockNumber.toString());
    console.log("  Current Block:", gameState.currentBlock.toString());
    console.log("  Blocks Remaining:", gameState.blocksRemaining.toString());
    console.log("  Round Active:", gameState.roundActive);
  } catch (error) {
    console.log("\n⚠️  Could not fetch game state immediately (this is normal)");
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Add to .env:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log("\n2. Verify contract on Basescan:");
  console.log(`   npx hardhat verify --network baseSepolia ${address}`);
  console.log("\n3. Update app/lib/BlockhashGuessingGame.ts with contract ABI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
