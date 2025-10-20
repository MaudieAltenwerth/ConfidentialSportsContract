import hre from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Verify deployed contract on Etherscan
 * Reads deployment information and submits for verification
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Contract Verification on Etherscan                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  const network = hre.network.name;
  console.log(`📡 Network: ${network}`);
  console.log();

  // Check if network supports verification
  if (network === "hardhat" || network === "localhost") {
    console.log("⚠️  Warning: Cannot verify contracts on local networks");
    console.log("   Please deploy to a public network (sepolia, mainnet, etc.)");
    process.exit(0);
  }

  // Load deployment information
  const deploymentFile = path.join(
    __dirname,
    "..",
    "deployments",
    `${network}-deployment.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Error: Deployment file not found: ${deploymentFile}`);
    console.error("   Please deploy the contract first using: npm run deploy");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deployment.contractAddress;

  console.log("📋 Contract Information:");
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Network: ${deployment.network}`);
  console.log(`   Deployer: ${deployment.deployerAddress}`);
  console.log();

  // Check if Etherscan API key is configured
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ Error: ETHERSCAN_API_KEY not found in environment");
    console.error("   Please add your Etherscan API key to .env file");
    console.error("   Get your API key from: https://etherscan.io/myapikey");
    process.exit(1);
  }

  console.log("🔍 Starting verification process...");
  console.log("   This may take a few moments...");
  console.log();

  try {
    // Verify the contract
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
      contract: "contracts/ConfidentialSportsContract.sol:ConfidentialSportsContract",
    });

    console.log();
    console.log("✅ Contract verified successfully!");
    console.log();

    // Display Etherscan link
    let explorerUrl;
    if (network === "sepolia") {
      explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}#code`;
    } else if (network === "mainnet") {
      explorerUrl = `https://etherscan.io/address/${contractAddress}#code`;
    } else {
      explorerUrl = `https://${network}.etherscan.io/address/${contractAddress}#code`;
    }

    console.log("🔗 View verified contract:");
    console.log(`   ${explorerUrl}`);
    console.log();

    // Update deployment file with verification status
    deployment.verified = true;
    deployment.verificationTime = new Date().toISOString();
    deployment.explorerUrl = explorerUrl;
    fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

    console.log("💾 Deployment file updated with verification status");
    console.log();

    console.log("════════════════════════════════════════════════════════════");
    console.log("✨ Verification Complete!");
    console.log("════════════════════════════════════════════════════════════");

  } catch (error) {
    console.error();
    console.error("❌ Verification Failed!");
    console.error();

    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contract is already verified on Etherscan");
      console.log();

      let explorerUrl;
      if (network === "sepolia") {
        explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}#code`;
      } else if (network === "mainnet") {
        explorerUrl = `https://etherscan.io/address/${contractAddress}#code`;
      }

      console.log("🔗 View contract:");
      console.log(`   ${explorerUrl}`);
      console.log();
    } else {
      console.error("Error details:", error.message);
      console.error();
      console.error("💡 Troubleshooting tips:");
      console.error("   1. Ensure the contract is deployed and confirmed");
      console.error("   2. Check your ETHERSCAN_API_KEY is valid");
      console.error("   3. Wait a few moments and try again");
      console.error("   4. Ensure constructor arguments match deployment");
      process.exit(1);
    }
  }
}

// Execute verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
