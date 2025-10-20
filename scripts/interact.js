import hre from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Interact with the deployed ConfidentialSportsContract
 * Provides various interaction options for contract operations
 */

// Load deployment information
function loadDeployment() {
  const network = hre.network.name;
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

  return JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
}

// Get contract instance
async function getContract() {
  const deployment = loadDeployment();
  const ConfidentialSportsContract = await hre.ethers.getContractFactory(
    "ConfidentialSportsContract"
  );
  return ConfidentialSportsContract.attach(deployment.contractAddress);
}

// Display current contract stats
async function displayStats(contract) {
  console.log("📊 Current Contract Statistics:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const stats = await contract.getCurrentStats();
  const contractOwner = await contract.contractOwner();

  console.log(`   Season: ${stats[0]}`);
  console.log(`   Total Athletes: ${stats[1]}`);
  console.log(`   Active Teams: ${stats[2]}`);
  console.log(`   Total Proposals: ${stats[3]}`);
  console.log(`   Contract Owner: ${contractOwner}`);
  console.log();
}

// Register a new team
async function registerTeam(contract, signer) {
  console.log("🏀 Registering New Team...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const teamName = "Los Angeles Lakers";
  const league = "NBA";
  const teamManager = await signer.getAddress();
  const salaryCap = 150000000; // $150M salary cap

  console.log(`   Team Name: ${teamName}`);
  console.log(`   League: ${league}`);
  console.log(`   Manager: ${teamManager}`);
  console.log(`   Salary Cap: $${(salaryCap / 1000000).toFixed(1)}M`);
  console.log();

  try {
    const tx = await contract.registerTeam(
      teamName,
      league,
      teamManager,
      salaryCap
    );
    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`   ✅ Team registered successfully!`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    // Get team ID from event
    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "TeamRegistered"
    );
    if (event) {
      const teamId = event.args[0];
      console.log(`   Team ID: ${teamId}`);
    }
    console.log();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log();
  }
}

// Register a new athlete
async function registerAthlete(contract, signer) {
  console.log("🏃 Registering New Athlete...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const athleteName = "LeBron James";
  const position = "Forward";
  const teamId = 1; // Assuming team 1 exists
  const athleteAddress = await signer.getAddress();
  const salary = 45000000; // $45M salary
  const bonus = 5000000; // $5M bonus
  const contractDuration = 12; // 12 months

  console.log(`   Name: ${athleteName}`);
  console.log(`   Position: ${position}`);
  console.log(`   Team ID: ${teamId}`);
  console.log(`   Address: ${athleteAddress}`);
  console.log(`   Salary: $${(salary / 1000000).toFixed(1)}M`);
  console.log(`   Bonus: $${(bonus / 1000000).toFixed(1)}M`);
  console.log(`   Contract Duration: ${contractDuration} months`);
  console.log();

  try {
    const tx = await contract.registerAthlete(
      athleteName,
      position,
      teamId,
      athleteAddress,
      salary,
      bonus,
      contractDuration
    );
    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`   ✅ Athlete registered successfully!`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    // Get athlete ID from event
    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "AthleteRegistered"
    );
    if (event) {
      const athleteId = event.args[0];
      console.log(`   Athlete ID: ${athleteId}`);
    }
    console.log();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log();
  }
}

// Get athlete information
async function getAthleteInfo(contract, athleteId) {
  console.log(`🔍 Fetching Athlete Information (ID: ${athleteId})...`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const info = await contract.getAthleteInfo(athleteId);
    console.log(`   Name: ${info[0]}`);
    console.log(`   Position: ${info[1]}`);
    console.log(`   Team ID: ${info[2]}`);
    console.log(`   Active: ${info[3]}`);
    console.log(`   Contract Start: ${new Date(Number(info[4]) * 1000).toLocaleDateString()}`);
    console.log(`   Contract End: ${new Date(Number(info[5]) * 1000).toLocaleDateString()}`);
    console.log(`   Address: ${info[6]}`);
    console.log();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log();
  }
}

// Get team information
async function getTeamInfo(contract, teamId) {
  console.log(`🔍 Fetching Team Information (ID: ${teamId})...`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const info = await contract.getTeamInfo(teamId);
    console.log(`   Team Name: ${info[0]}`);
    console.log(`   League: ${info[1]}`);
    console.log(`   Manager: ${info[2]}`);
    console.log(`   Athletes: ${info[3].length} registered`);
    console.log(`   Active: ${info[4]}`);
    console.log();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log();
  }
}

// Propose a contract
async function proposeContract(contract, signer) {
  console.log("📝 Creating Contract Proposal...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const athleteId = 1; // Assuming athlete 1 exists
  const teamId = 1; // Assuming team 1 exists
  const proposedSalary = 50000000; // $50M
  const proposedBonus = 7000000; // $7M
  const contractDuration = 24; // 24 months

  console.log(`   Athlete ID: ${athleteId}`);
  console.log(`   Team ID: ${teamId}`);
  console.log(`   Proposed Salary: $${(proposedSalary / 1000000).toFixed(1)}M`);
  console.log(`   Proposed Bonus: $${(proposedBonus / 1000000).toFixed(1)}M`);
  console.log(`   Duration: ${contractDuration} months`);
  console.log();

  try {
    const tx = await contract.proposeContract(
      athleteId,
      teamId,
      proposedSalary,
      proposedBonus,
      contractDuration
    );
    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`   ✅ Contract proposal created successfully!`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    // Get proposal ID from event
    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "ContractProposed"
    );
    if (event) {
      const proposalId = event.args[0];
      console.log(`   Proposal ID: ${proposalId}`);
    }
    console.log();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log();
  }
}

// Start a new season
async function startNewSeason(contract) {
  console.log("🎯 Starting New Season...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const tx = await contract.startNewSeason();
    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`   ✅ New season started successfully!`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    const currentSeason = await contract.currentSeason();
    console.log(`   Current Season: ${currentSeason}`);
    console.log();
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    console.log();
  }
}

// Main interaction menu
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Confidential Sports Contract - Interaction Script       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  const network = hre.network.name;
  const deployment = loadDeployment();
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();

  console.log(`📡 Network: ${network}`);
  console.log(`📍 Contract: ${deployment.contractAddress}`);
  console.log(`👤 Signer: ${signerAddress}`);
  console.log();

  const contract = await getContract();

  // Display current stats
  await displayStats(contract);

  // Example interactions (uncomment to use)
  console.log("🎬 Running Example Interactions...");
  console.log();

  // 1. Register a team (requires owner privileges)
  // await registerTeam(contract, signer);

  // 2. Register an athlete (requires team manager privileges)
  // await registerAthlete(contract, signer);

  // 3. Get athlete info
  // await getAthleteInfo(contract, 1);

  // 4. Get team info
  // await getTeamInfo(contract, 1);

  // 5. Propose a contract
  // await proposeContract(contract, signer);

  // 6. Start new season (requires owner privileges)
  // await startNewSeason(contract);

  console.log("💡 Tip: Edit scripts/interact.js to uncomment desired operations");
  console.log();

  console.log("════════════════════════════════════════════════════════════");
  console.log("✨ Interaction Complete!");
  console.log("════════════════════════════════════════════════════════════");
}

// Execute interaction
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error();
    console.error("❌ Interaction Failed!");
    console.error();
    console.error(error);
    process.exit(1);
  });
