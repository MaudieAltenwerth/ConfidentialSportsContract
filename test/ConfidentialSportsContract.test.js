const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConfidentialSportsContract", function () {
  let contract;
  let owner;
  let teamManager1;
  let teamManager2;
  let athlete1;
  let athlete2;

  beforeEach(async function () {
    // Get signers
    [owner, teamManager1, teamManager2, athlete1, athlete2] =
      await ethers.getSigners();

    // Deploy contract
    const ConfidentialSportsContract = await ethers.getContractFactory(
      "ConfidentialSportsContract"
    );
    contract = await ConfidentialSportsContract.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.contractOwner()).to.equal(await owner.getAddress());
    });

    it("Should initialize with season 1", async function () {
      expect(await contract.currentSeason()).to.equal(1);
    });

    it("Should initialize with zero teams", async function () {
      expect(await contract.totalTeams()).to.equal(0);
    });

    it("Should initialize counters at zero", async function () {
      expect(await contract.athleteCounter()).to.equal(0);
      expect(await contract.teamCounter()).to.equal(0);
      expect(await contract.proposalCounter()).to.equal(0);
    });
  });

  describe("Team Registration", function () {
    it("Should allow owner to register a team", async function () {
      const teamName = "Golden State Warriors";
      const league = "NBA";
      const managerAddress = await teamManager1.getAddress();
      const salaryCap = 150000000;

      await expect(
        contract.registerTeam(teamName, league, managerAddress, salaryCap)
      )
        .to.emit(contract, "TeamRegistered")
        .withArgs(1, teamName, managerAddress);

      expect(await contract.totalTeams()).to.equal(1);
      expect(await contract.teamCounter()).to.equal(1);
    });

    it("Should not allow non-owner to register team", async function () {
      await expect(
        contract
          .connect(teamManager1)
          .registerTeam(
            "Lakers",
            "NBA",
            await teamManager1.getAddress(),
            150000000
          )
      ).to.be.revertedWith("Not authorized");
    });

    it("Should store team information correctly", async function () {
      const teamName = "Miami Heat";
      const league = "NBA";
      const managerAddress = await teamManager1.getAddress();
      const salaryCap = 145000000;

      await contract.registerTeam(teamName, league, managerAddress, salaryCap);

      const teamInfo = await contract.getTeamInfo(1);
      expect(teamInfo[0]).to.equal(teamName);
      expect(teamInfo[1]).to.equal(league);
      expect(teamInfo[2]).to.equal(managerAddress);
      expect(teamInfo[4]).to.equal(true); // isActive
    });
  });

  describe("Athlete Registration", function () {
    beforeEach(async function () {
      // Register a team first
      await contract.registerTeam(
        "Lakers",
        "NBA",
        await teamManager1.getAddress(),
        150000000
      );
    });

    it("Should allow team manager to register athlete", async function () {
      const athleteName = "LeBron James";
      const position = "Forward";
      const athleteAddress = await athlete1.getAddress();
      const salary = 45000000;
      const bonus = 5000000;
      const duration = 12;

      await expect(
        contract
          .connect(teamManager1)
          .registerAthlete(
            athleteName,
            position,
            1,
            athleteAddress,
            salary,
            bonus,
            duration
          )
      )
        .to.emit(contract, "AthleteRegistered")
        .withArgs(1, athleteName, 1);

      expect(await contract.athleteCounter()).to.equal(1);
    });

    it("Should not allow non-manager to register athlete", async function () {
      await expect(
        contract
          .connect(athlete1)
          .registerAthlete(
            "Player",
            "Guard",
            1,
            await athlete1.getAddress(),
            40000000,
            4000000,
            12
          )
      ).to.be.revertedWith("Not team manager");
    });

    it("Should store athlete information correctly", async function () {
      const athleteName = "Stephen Curry";
      const position = "Point Guard";
      const athleteAddress = await athlete1.getAddress();

      await contract
        .connect(teamManager1)
        .registerAthlete(athleteName, position, 1, athleteAddress, 45000000, 5000000, 24);

      const athleteInfo = await contract.getAthleteInfo(1);
      expect(athleteInfo[0]).to.equal(athleteName);
      expect(athleteInfo[1]).to.equal(position);
      expect(athleteInfo[2]).to.equal(1); // teamId
      expect(athleteInfo[3]).to.equal(true); // isActive
      expect(athleteInfo[6]).to.equal(athleteAddress);
    });

    it("Should emit PayrollUpdated event when athlete registered", async function () {
      await expect(
        contract
          .connect(teamManager1)
          .registerAthlete(
            "Player",
            "Guard",
            1,
            await athlete1.getAddress(),
            40000000,
            4000000,
            12
          )
      ).to.emit(contract, "PayrollUpdated");
    });
  });

  describe("Contract Proposals", function () {
    beforeEach(async function () {
      // Setup: Register team and athlete
      await contract.registerTeam(
        "Lakers",
        "NBA",
        await teamManager1.getAddress(),
        150000000
      );

      await contract
        .connect(teamManager1)
        .registerAthlete(
          "Athlete",
          "Forward",
          1,
          await athlete1.getAddress(),
          40000000,
          4000000,
          12
        );
    });

    it("Should allow team manager to propose contract", async function () {
      await expect(
        contract
          .connect(teamManager1)
          .proposeContract(1, 1, 50000000, 7000000, 24)
      )
        .to.emit(contract, "ContractProposed")
        .withArgs(1, 1, 1);

      expect(await contract.proposalCounter()).to.equal(1);
    });

    it("Should not allow non-manager to propose contract", async function () {
      await expect(
        contract.connect(athlete2).proposeContract(1, 1, 50000000, 7000000, 24)
      ).to.be.revertedWith("Not team manager");
    });

    it("Should store proposal information correctly", async function () {
      await contract
        .connect(teamManager1)
        .proposeContract(1, 1, 50000000, 7000000, 36);

      const proposal = await contract.getProposalInfo(1);
      expect(proposal[0]).to.equal(1); // athleteId
      expect(proposal[1]).to.equal(1); // teamId
      expect(proposal[2]).to.equal(36); // contractDuration
      expect(proposal[3]).to.equal(true); // isPending
      expect(proposal[4]).to.equal(false); // isApproved
    });
  });

  describe("Contract Approval", function () {
    beforeEach(async function () {
      // Setup: Register team, athlete, and create proposal
      await contract.registerTeam(
        "Lakers",
        "NBA",
        await teamManager1.getAddress(),
        150000000
      );

      await contract
        .connect(teamManager1)
        .registerAthlete(
          "Athlete",
          "Forward",
          1,
          await athlete1.getAddress(),
          40000000,
          4000000,
          12
        );

      await contract
        .connect(teamManager1)
        .proposeContract(1, 1, 50000000, 7000000, 24);
    });

    it("Should allow athlete to approve their contract", async function () {
      await expect(contract.connect(athlete1).approveContract(1))
        .to.emit(contract, "ContractApproved")
        .withArgs(1, 1, 1);

      const proposal = await contract.getProposalInfo(1);
      expect(proposal[3]).to.equal(false); // isPending
      expect(proposal[4]).to.equal(true); // isApproved
    });

    it("Should not allow non-athlete to approve contract", async function () {
      await expect(
        contract.connect(athlete2).approveContract(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should update athlete info after approval", async function () {
      await contract.connect(athlete1).approveContract(1);

      const athleteInfo = await contract.getAthleteInfo(1);
      expect(athleteInfo[2]).to.equal(1); // teamId should remain the same
      expect(athleteInfo[3]).to.equal(true); // isActive
    });
  });

  describe("Salary Updates", function () {
    beforeEach(async function () {
      await contract.registerTeam(
        "Lakers",
        "NBA",
        await teamManager1.getAddress(),
        150000000
      );

      await contract
        .connect(teamManager1)
        .registerAthlete(
          "Athlete",
          "Forward",
          1,
          await athlete1.getAddress(),
          40000000,
          4000000,
          12
        );
    });

    it("Should allow team manager to update athlete salary", async function () {
      await expect(
        contract.connect(teamManager1).updateAthleteSalary(1, 45000000, 5000000)
      ).to.emit(contract, "SalaryUpdated");
    });

    it("Should allow athlete to update their own salary", async function () {
      await expect(
        contract.connect(athlete1).updateAthleteSalary(1, 45000000, 5000000)
      ).to.emit(contract, "SalaryUpdated");
    });

    it("Should not allow unauthorized users to update salary", async function () {
      await expect(
        contract.connect(athlete2).updateAthleteSalary(1, 45000000, 5000000)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Season Management", function () {
    it("Should allow owner to start new season", async function () {
      const initialSeason = await contract.currentSeason();

      await expect(contract.startNewSeason()).to.emit(contract, "SeasonStarted");

      const newSeason = await contract.currentSeason();
      expect(newSeason).to.equal(initialSeason + 1n);
    });

    it("Should not allow non-owner to start new season", async function () {
      await expect(
        contract.connect(teamManager1).startNewSeason()
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Deactivation", function () {
    beforeEach(async function () {
      await contract.registerTeam(
        "Lakers",
        "NBA",
        await teamManager1.getAddress(),
        150000000
      );

      await contract
        .connect(teamManager1)
        .registerAthlete(
          "Athlete",
          "Forward",
          1,
          await athlete1.getAddress(),
          40000000,
          4000000,
          12
        );
    });

    it("Should allow team manager to deactivate athlete", async function () {
      await contract.connect(teamManager1).deactivateAthlete(1);

      const athleteInfo = await contract.getAthleteInfo(1);
      expect(athleteInfo[3]).to.equal(false); // isActive
    });

    it("Should allow owner to deactivate team", async function () {
      await contract.deactivateTeam(1);

      const teamInfo = await contract.getTeamInfo(1);
      expect(teamInfo[4]).to.equal(false); // isActive
      expect(await contract.totalTeams()).to.equal(0);
    });

    it("Should not allow non-owner to deactivate team", async function () {
      await expect(
        contract.connect(teamManager1).deactivateTeam(1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Statistics", function () {
    it("Should return correct current stats", async function () {
      const stats = await contract.getCurrentStats();
      expect(stats[0]).to.equal(1); // season
      expect(stats[1]).to.equal(0); // totalAthletes
      expect(stats[2]).to.equal(0); // activeTeams
      expect(stats[3]).to.equal(0); // totalProposals
    });

    it("Should update stats after operations", async function () {
      await contract.registerTeam(
        "Lakers",
        "NBA",
        await teamManager1.getAddress(),
        150000000
      );

      const stats = await contract.getCurrentStats();
      expect(stats[2]).to.equal(1); // activeTeams
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await contract.registerTeam(
        "Lakers",
        "NBA",
        await teamManager1.getAddress(),
        150000000
      );

      await contract
        .connect(teamManager1)
        .registerAthlete(
          "Athlete",
          "Forward",
          1,
          await athlete1.getAddress(),
          40000000,
          4000000,
          12
        );
    });

    it("Should return athlete addresses", async function () {
      const athletes = await contract.getMyAthletes(
        await athlete1.getAddress()
      );
      expect(athletes.length).to.equal(1);
      expect(athletes[0]).to.equal(1);
    });

    it("Should return team manager's teams", async function () {
      const teams = await contract.getMyTeams(await teamManager1.getAddress());
      expect(teams.length).to.equal(1);
      expect(teams[0]).to.equal(1);
    });
  });
});
