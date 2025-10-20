import hre from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Simulate complete workflow for ConfidentialSportsContract
 * Demonstrates full lifecycle of teams, athletes, and contracts
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

// Delay helper
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Display section header
function displaySection(title) {
  console.log();
  console.log("═".repeat(60));
  console.log(`  ${title}`);
  console.log("═".repeat(60));
  console.log();
}

// Display stats
async function displayStats(contract, title = "Contract Statistics") {
  displaySection(title);

  const stats = await contract.getCurrentStats();
  const contractOwner = await contract.contractOwner();

  console.log(`📊 Current Season: ${stats[0]}`);
  console.log(`👥 Total Athletes: ${stats[1]}`);
  console.log(`🏀 Active Teams: ${stats[2]}`);
  console.log(`📝 Total Proposals: ${stats[3]}`);
  console.log(`👤 Contract Owner: ${contractOwner}`);
  console.log();
}

// Simulation workflow
async function runSimulation() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Confidential Sports Contract - Full Simulation          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  const network = hre.network.name;
  const deployment = loadDeployment();
  const [owner, teamManager1, teamManager2, athlete1, athlete2, athlete3] =
    await hre.ethers.getSigners();

  console.log(`📡 Network: ${network}`);
  console.log(`📍 Contract: ${deployment.contractAddress}`);
  console.log();
  console.log("👥 Simulation Actors:");
  console.log(`   Owner: ${await owner.getAddress()}`);
  console.log(`   Team Manager 1: ${await teamManager1.getAddress()}`);
  console.log(`   Team Manager 2: ${await teamManager2.getAddress()}`);
  console.log(`   Athlete 1: ${await athlete1.getAddress()}`);
  console.log(`   Athlete 2: ${await athlete2.getAddress()}`);
  console.log(`   Athlete 3: ${await athlete3.getAddress()}`);
  console.log();

  const contract = await getContract();

  // Initial state
  await displayStats(contract, "Initial State");
  await delay(1000);

  // Step 1: Register Teams
  displaySection("Step 1: Register Teams");

  const teams = [
    {
      name: "Golden State Warriors",
      league: "NBA",
      manager: await teamManager1.getAddress(),
      salaryCap: 150000000,
    },
    {
      name: "Miami Heat",
      league: "NBA",
      manager: await teamManager2.getAddress(),
      salaryCap: 145000000,
    },
  ];

  const teamIds = [];

  for (const team of teams) {
    console.log(`🏀 Registering team: ${team.name}`);
    console.log(`   League: ${team.league}`);
    console.log(`   Manager: ${team.manager}`);
    console.log(`   Salary Cap: $${(team.salaryCap / 1000000).toFixed(1)}M`);

    const tx = await contract.registerTeam(
      team.name,
      team.league,
      team.manager,
      team.salaryCap
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "TeamRegistered"
    );
    const teamId = event.args[0];
    teamIds.push(teamId);

    console.log(`   ✅ Team registered with ID: ${teamId}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log();
    await delay(500);
  }

  await displayStats(contract, "After Team Registration");
  await delay(1000);

  // Step 2: Register Athletes
  displaySection("Step 2: Register Athletes");

  const athletes = [
    {
      name: "Stephen Curry",
      position: "Point Guard",
      teamId: teamIds[0],
      address: await athlete1.getAddress(),
      salary: 45000000,
      bonus: 5000000,
      duration: 24,
    },
    {
      name: "Klay Thompson",
      position: "Shooting Guard",
      teamId: teamIds[0],
      address: await athlete2.getAddress(),
      salary: 40000000,
      bonus: 4000000,
      duration: 24,
    },
    {
      name: "Jimmy Butler",
      position: "Small Forward",
      teamId: teamIds[1],
      address: await athlete3.getAddress(),
      salary: 48000000,
      bonus: 6000000,
      duration: 36,
    },
  ];

  const athleteIds = [];

  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const manager = i < 2 ? teamManager1 : teamManager2;

    console.log(`🏃 Registering athlete: ${athlete.name}`);
    console.log(`   Position: ${athlete.position}`);
    console.log(`   Team ID: ${athlete.teamId}`);
    console.log(`   Salary: $${(athlete.salary / 1000000).toFixed(1)}M`);
    console.log(`   Bonus: $${(athlete.bonus / 1000000).toFixed(1)}M`);
    console.log(`   Duration: ${athlete.duration} months`);

    const tx = await contract
      .connect(manager)
      .registerAthlete(
        athlete.name,
        athlete.position,
        athlete.teamId,
        athlete.address,
        athlete.salary,
        athlete.bonus,
        athlete.duration
      );
    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "AthleteRegistered"
    );
    const athleteId = event.args[0];
    athleteIds.push(athleteId);

    console.log(`   ✅ Athlete registered with ID: ${athleteId}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log();
    await delay(500);
  }

  await displayStats(contract, "After Athlete Registration");
  await delay(1000);

  // Step 3: Create Contract Proposals
  displaySection("Step 3: Create Contract Proposals");

  console.log(`📝 Team 1 proposes new contract to Athlete 1`);
  console.log(`   Proposed Salary: $50M`);
  console.log(`   Proposed Bonus: $7M`);
  console.log(`   Duration: 36 months`);

  const proposalTx = await contract
    .connect(teamManager1)
    .proposeContract(athleteIds[0], teamIds[0], 50000000, 7000000, 36);
  const proposalReceipt = await proposalTx.wait();

  const proposalEvent = proposalReceipt.logs.find(
    (log) => log.fragment && log.fragment.name === "ContractProposed"
  );
  const proposalId = proposalEvent.args[0];

  console.log(`   ✅ Proposal created with ID: ${proposalId}`);
  console.log(`   Gas used: ${proposalReceipt.gasUsed.toString()}`);
  console.log();
  await delay(1000);

  // Step 4: Approve Contract
  displaySection("Step 4: Approve Contract Proposal");

  console.log(`✍️  Athlete 1 approves proposal ${proposalId}`);

  const approveTx = await contract.connect(athlete1).approveContract(proposalId);
  const approveReceipt = await approveTx.wait();

  console.log(`   ✅ Contract approved!`);
  console.log(`   Gas used: ${approveReceipt.gasUsed.toString()}`);
  console.log();
  await delay(1000);

  // Step 5: Query Team and Athlete Information
  displaySection("Step 5: Query Information");

  console.log(`🔍 Fetching Team 1 information...`);
  const team1Info = await contract.getTeamInfo(teamIds[0]);
  console.log(`   Team Name: ${team1Info[0]}`);
  console.log(`   League: ${team1Info[1]}`);
  console.log(`   Manager: ${team1Info[2]}`);
  console.log(`   Athletes Count: ${team1Info[3].length}`);
  console.log(`   Active: ${team1Info[4]}`);
  console.log();

  console.log(`🔍 Fetching Athlete 1 information...`);
  const athlete1Info = await contract.getAthleteInfo(athleteIds[0]);
  console.log(`   Name: ${athlete1Info[0]}`);
  console.log(`   Position: ${athlete1Info[1]}`);
  console.log(`   Team ID: ${athlete1Info[2]}`);
  console.log(`   Active: ${athlete1Info[3]}`);
  console.log(
    `   Contract Start: ${new Date(Number(athlete1Info[4]) * 1000).toLocaleDateString()}`
  );
  console.log(
    `   Contract End: ${new Date(Number(athlete1Info[5]) * 1000).toLocaleDateString()}`
  );
  console.log();
  await delay(1000);

  // Step 6: Update Athlete Salary
  displaySection("Step 6: Update Athlete Salary");

  console.log(`💰 Updating Athlete 2 salary...`);
  console.log(`   New Salary: $42M`);
  console.log(`   New Bonus: $5M`);

  const updateTx = await contract
    .connect(teamManager1)
    .updateAthleteSalary(athleteIds[1], 42000000, 5000000);
  const updateReceipt = await updateTx.wait();

  console.log(`   ✅ Salary updated successfully!`);
  console.log(`   Gas used: ${updateReceipt.gasUsed.toString()}`);
  console.log();
  await delay(1000);

  // Step 7: Check Salary Cap Compliance
  displaySection("Step 7: Check Salary Cap Compliance");

  console.log(`🔐 Checking Team 1 salary cap compliance...`);
  console.log(`   Note: Result is encrypted, only visible to team manager`);

  const complianceTx = await contract.checkSalaryCap(teamIds[0]);
  console.log(`   ✅ Salary cap check executed`);
  console.log(`   Result: [Encrypted]`);
  console.log();
  await delay(1000);

  // Step 8: Start New Season
  displaySection("Step 8: Start New Season");

  console.log(`🎯 Starting new season...`);
  const seasonTx = await contract.startNewSeason();
  const seasonReceipt = await seasonTx.wait();

  const newSeason = await contract.currentSeason();
  console.log(`   ✅ New season started!`);
  console.log(`   Current Season: ${newSeason}`);
  console.log(`   Gas used: ${seasonReceipt.gasUsed.toString()}`);
  console.log();
  await delay(1000);

  // Final State
  await displayStats(contract, "Final State After Simulation");

  // Simulation Summary
  displaySection("Simulation Summary");

  console.log("✅ Simulation completed successfully!");
  console.log();
  console.log("📋 Operations performed:");
  console.log(`   ✓ Registered ${teams.length} teams`);
  console.log(`   ✓ Registered ${athletes.length} athletes`);
  console.log(`   ✓ Created 1 contract proposal`);
  console.log(`   ✓ Approved 1 contract`);
  console.log(`   ✓ Updated 1 athlete salary`);
  console.log(`   ✓ Checked salary cap compliance`);
  console.log(`   ✓ Started new season`);
  console.log();
  console.log("🔐 Privacy Features Demonstrated:");
  console.log(`   ✓ Encrypted salary storage`);
  console.log(`   ✓ Encrypted bonus storage`);
  console.log(`   ✓ Encrypted payroll calculations`);
  console.log(`   ✓ Encrypted salary cap verification`);
  console.log();

  console.log("═".repeat(60));
  console.log("✨ Simulation Complete!");
  console.log("═".repeat(60));
}

// Execute simulation
runSimulation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error();
    console.error("❌ Simulation Failed!");
    console.error();
    console.error(error);
    process.exit(1);
  });
