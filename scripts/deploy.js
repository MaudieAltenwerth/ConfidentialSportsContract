import hre from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Main deployment function for ConfidentialSportsContract
 * Deploys the contract and saves deployment information
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Confidential Sports Contract Deployment                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  // Get deployment network
  const network = hre.network.name;
  console.log(`📡 Network: ${network}`);
  console.log(`⛓️  Chain ID: ${hre.network.config.chainId}`);
  console.log();

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log("👤 Deployer Information:");
  console.log(`   Address: ${deployerAddress}`);
  console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH`);
  console.log();

  // Check if deployer has sufficient balance
  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no ETH balance");
    console.error("   Please fund your account before deploying");
    process.exit(1);
  }

  // Deploy the contract
  console.log("🚀 Deploying ConfidentialSportsContract...");
  console.log();

  const ConfidentialSportsContract = await hre.ethers.getContractFactory(
    "ConfidentialSportsContract"
  );

  const startTime = Date.now();
  const contract = await ConfidentialSportsContract.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("✅ Contract deployed successfully!");
  console.log();
  console.log("📋 Deployment Details:");
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Transaction Hash: ${contract.deploymentTransaction().hash}`);
  console.log(`   Block Number: ${contract.deploymentTransaction().blockNumber || 'Pending'}`);
  console.log(`   Deployment Time: ${deployTime}s`);
  console.log(`   Gas Used: ${contract.deploymentTransaction().gasLimit.toString()}`);
  console.log();

  // Verify initial state
  console.log("🔍 Verifying Initial State...");
  const contractOwner = await contract.contractOwner();
  const currentSeason = await contract.currentSeason();
  const totalTeams = await contract.totalTeams();

  console.log(`   Contract Owner: ${contractOwner}`);
  console.log(`   Current Season: ${currentSeason}`);
  console.log(`   Total Teams: ${totalTeams}`);
  console.log();

  // Save deployment information
  const deployment = {
    network: network,
    chainId: hre.network.config.chainId,
    contractName: "ConfidentialSportsContract",
    contractAddress: contractAddress,
    deployerAddress: deployerAddress,
    transactionHash: contract.deploymentTransaction().hash,
    blockNumber: contract.deploymentTransaction().blockNumber,
    deploymentTime: new Date().toISOString(),
    compiler: {
      solidity: hre.config.solidity.version,
    },
    contractOwner: contractOwner,
    initialState: {
      currentSeason: currentSeason.toString(),
      totalTeams: totalTeams.toString(),
    },
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to JSON file
  const deploymentFile = path.join(
    deploymentsDir,
    `${network}-deployment.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  console.log("💾 Deployment information saved:");
  console.log(`   File: ${deploymentFile}`);
  console.log();

  // Display next steps
  console.log("📝 Next Steps:");
  console.log("   1. Verify the contract on Etherscan:");
  console.log(`      npm run verify`);
  console.log();
  console.log("   2. Interact with the deployed contract:");
  console.log(`      npm run interact`);
  console.log();
  console.log("   3. Run simulation tests:");
  console.log(`      npm run simulate`);
  console.log();

  // Display Etherscan link if on a public network
  if (network === "sepolia") {
    console.log("🔗 Etherscan Link:");
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log();
  } else if (network === "mainnet") {
    console.log("🔗 Etherscan Link:");
    console.log(`   https://etherscan.io/address/${contractAddress}`);
    console.log();
  }

  console.log("════════════════════════════════════════════════════════════");
  console.log("✨ Deployment Complete!");
  console.log("════════════════════════════════════════════════════════════");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error();
    console.error("❌ Deployment Failed!");
    console.error();
    console.error(error);
    process.exit(1);
  });
