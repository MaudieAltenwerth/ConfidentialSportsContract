// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialSportsContract is SepoliaConfig {

    address public contractOwner;
    uint256 public currentSeason;
    uint256 public totalTeams;

    struct Athlete {
        string name;
        string position;
        uint256 teamId;
        euint32 encryptedSalary;
        euint32 encryptedBonus;
        bool isActive;
        uint256 contractStart;
        uint256 contractEnd;
        address athleteAddress;
    }

    struct Team {
        string teamName;
        string league;
        address teamManager;
        euint32 encryptedTotalPayroll;
        euint32 encryptedSalaryCap;
        uint256[] athleteIds;
        bool isActive;
    }

    struct ContractProposal {
        uint256 athleteId;
        uint256 teamId;
        euint32 proposedSalary;
        euint32 proposedBonus;
        uint256 contractDuration;
        bool isPending;
        bool isApproved;
        address proposer;
        uint256 timestamp;
    }

    mapping(uint256 => Athlete) public athletes;
    mapping(uint256 => Team) public teams;
    mapping(uint256 => ContractProposal) public proposals;
    mapping(address => uint256[]) public athletesByAddress;
    mapping(address => uint256[]) public teamsByManager;

    uint256 public athleteCounter;
    uint256 public teamCounter;
    uint256 public proposalCounter;

    event AthleteRegistered(uint256 indexed athleteId, string name, uint256 teamId);
    event TeamRegistered(uint256 indexed teamId, string teamName, address manager);
    event SalaryUpdated(uint256 indexed athleteId, uint256 timestamp);
    event ContractProposed(uint256 indexed proposalId, uint256 athleteId, uint256 teamId);
    event ContractApproved(uint256 indexed proposalId, uint256 athleteId, uint256 teamId);
    event PayrollUpdated(uint256 indexed teamId, uint256 timestamp);
    event SeasonStarted(uint256 indexed season, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Not authorized");
        _;
    }

    modifier onlyTeamManager(uint256 teamId) {
        require(teams[teamId].teamManager == msg.sender, "Not team manager");
        _;
    }

    modifier onlyAthlete(uint256 athleteId) {
        require(athletes[athleteId].athleteAddress == msg.sender, "Not athlete");
        _;
    }

    modifier validTeam(uint256 teamId) {
        require(teamId > 0 && teamId <= teamCounter && teams[teamId].isActive, "Invalid team");
        _;
    }

    modifier validAthlete(uint256 athleteId) {
        require(athleteId > 0 && athleteId <= athleteCounter && athletes[athleteId].isActive, "Invalid athlete");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        currentSeason = 1;
        athleteCounter = 0;
        teamCounter = 0;
        proposalCounter = 0;
    }

    function registerTeam(
        string memory _teamName,
        string memory _league,
        address _teamManager,
        uint32 _salaryCap
    ) external onlyOwner returns (uint256) {
        teamCounter++;

        euint32 encryptedSalaryCap = FHE.asEuint32(_salaryCap);
        euint32 encryptedZero = FHE.asEuint32(0);

        teams[teamCounter] = Team({
            teamName: _teamName,
            league: _league,
            teamManager: _teamManager,
            encryptedTotalPayroll: encryptedZero,
            encryptedSalaryCap: encryptedSalaryCap,
            athleteIds: new uint256[](0),
            isActive: true
        });

        teamsByManager[_teamManager].push(teamCounter);
        totalTeams++;

        FHE.allowThis(encryptedSalaryCap);
        FHE.allowThis(encryptedZero);
        FHE.allow(encryptedSalaryCap, _teamManager);

        emit TeamRegistered(teamCounter, _teamName, _teamManager);
        return teamCounter;
    }

    function registerAthlete(
        string memory _name,
        string memory _position,
        uint256 _teamId,
        address _athleteAddress,
        uint32 _salary,
        uint32 _bonus,
        uint256 _contractDurationMonths
    ) external validTeam(_teamId) onlyTeamManager(_teamId) returns (uint256) {
        athleteCounter++;

        euint32 encryptedSalary = FHE.asEuint32(_salary);
        euint32 encryptedBonus = FHE.asEuint32(_bonus);

        athletes[athleteCounter] = Athlete({
            name: _name,
            position: _position,
            teamId: _teamId,
            encryptedSalary: encryptedSalary,
            encryptedBonus: encryptedBonus,
            isActive: true,
            contractStart: block.timestamp,
            contractEnd: block.timestamp + (_contractDurationMonths * 30 days),
            athleteAddress: _athleteAddress
        });

        teams[_teamId].athleteIds.push(athleteCounter);
        athletesByAddress[_athleteAddress].push(athleteCounter);

        FHE.allowThis(encryptedSalary);
        FHE.allowThis(encryptedBonus);
        FHE.allow(encryptedSalary, _athleteAddress);
        FHE.allow(encryptedBonus, _athleteAddress);
        FHE.allow(encryptedSalary, teams[_teamId].teamManager);
        FHE.allow(encryptedBonus, teams[_teamId].teamManager);

        _updateTeamPayroll(_teamId);

        emit AthleteRegistered(athleteCounter, _name, _teamId);
        return athleteCounter;
    }

    function proposeContract(
        uint256 _athleteId,
        uint256 _teamId,
        uint32 _proposedSalary,
        uint32 _proposedBonus,
        uint256 _contractDuration
    ) external validAthlete(_athleteId) validTeam(_teamId) onlyTeamManager(_teamId) returns (uint256) {
        proposalCounter++;

        euint32 encryptedProposedSalary = FHE.asEuint32(_proposedSalary);
        euint32 encryptedProposedBonus = FHE.asEuint32(_proposedBonus);

        proposals[proposalCounter] = ContractProposal({
            athleteId: _athleteId,
            teamId: _teamId,
            proposedSalary: encryptedProposedSalary,
            proposedBonus: encryptedProposedBonus,
            contractDuration: _contractDuration,
            isPending: true,
            isApproved: false,
            proposer: msg.sender,
            timestamp: block.timestamp
        });

        FHE.allowThis(encryptedProposedSalary);
        FHE.allowThis(encryptedProposedBonus);
        FHE.allow(encryptedProposedSalary, athletes[_athleteId].athleteAddress);
        FHE.allow(encryptedProposedBonus, athletes[_athleteId].athleteAddress);

        emit ContractProposed(proposalCounter, _athleteId, _teamId);
        return proposalCounter;
    }

    function approveContract(uint256 _proposalId) external {
        require(_proposalId > 0 && _proposalId <= proposalCounter, "Invalid proposal");
        require(proposals[_proposalId].isPending, "Proposal not pending");

        ContractProposal storage proposal = proposals[_proposalId];
        require(athletes[proposal.athleteId].athleteAddress == msg.sender, "Not authorized");

        Athlete storage athlete = athletes[proposal.athleteId];
        athlete.encryptedSalary = proposal.proposedSalary;
        athlete.encryptedBonus = proposal.proposedBonus;
        athlete.teamId = proposal.teamId;
        athlete.contractStart = block.timestamp;
        athlete.contractEnd = block.timestamp + (proposal.contractDuration * 30 days);

        proposal.isPending = false;
        proposal.isApproved = true;

        _updateTeamPayroll(proposal.teamId);

        emit ContractApproved(_proposalId, proposal.athleteId, proposal.teamId);
    }

    function updateAthleteSalary(
        uint256 _athleteId,
        uint32 _newSalary,
        uint32 _newBonus
    ) external validAthlete(_athleteId) {
        Athlete storage athlete = athletes[_athleteId];
        require(
            teams[athlete.teamId].teamManager == msg.sender ||
            athlete.athleteAddress == msg.sender ||
            msg.sender == contractOwner,
            "Not authorized"
        );

        euint32 newEncryptedSalary = FHE.asEuint32(_newSalary);
        euint32 newEncryptedBonus = FHE.asEuint32(_newBonus);

        athlete.encryptedSalary = newEncryptedSalary;
        athlete.encryptedBonus = newEncryptedBonus;

        FHE.allowThis(newEncryptedSalary);
        FHE.allowThis(newEncryptedBonus);
        FHE.allow(newEncryptedSalary, athlete.athleteAddress);
        FHE.allow(newEncryptedBonus, athlete.athleteAddress);
        FHE.allow(newEncryptedSalary, teams[athlete.teamId].teamManager);
        FHE.allow(newEncryptedBonus, teams[athlete.teamId].teamManager);

        _updateTeamPayroll(athlete.teamId);

        emit SalaryUpdated(_athleteId, block.timestamp);
    }

    function _updateTeamPayroll(uint256 _teamId) internal validTeam(_teamId) {
        Team storage team = teams[_teamId];
        euint32 totalPayroll = FHE.asEuint32(0);

        for (uint256 i = 0; i < team.athleteIds.length; i++) {
            uint256 athleteId = team.athleteIds[i];
            if (athletes[athleteId].isActive && athletes[athleteId].teamId == _teamId) {
                euint32 athleteTotal = FHE.add(
                    athletes[athleteId].encryptedSalary,
                    athletes[athleteId].encryptedBonus
                );
                totalPayroll = FHE.add(totalPayroll, athleteTotal);
            }
        }

        team.encryptedTotalPayroll = totalPayroll;
        FHE.allowThis(totalPayroll);
        FHE.allow(totalPayroll, team.teamManager);

        emit PayrollUpdated(_teamId, block.timestamp);
    }

    function checkSalaryCap(uint256 _teamId) external validTeam(_teamId) returns (ebool) {
        Team storage team = teams[_teamId];
        return FHE.le(team.encryptedTotalPayroll, team.encryptedSalaryCap);
    }

    function getAthleteInfo(uint256 _athleteId) external view validAthlete(_athleteId) returns (
        string memory name,
        string memory position,
        uint256 teamId,
        bool isActive,
        uint256 contractStart,
        uint256 contractEnd,
        address athleteAddress
    ) {
        Athlete storage athlete = athletes[_athleteId];
        return (
            athlete.name,
            athlete.position,
            athlete.teamId,
            athlete.isActive,
            athlete.contractStart,
            athlete.contractEnd,
            athlete.athleteAddress
        );
    }

    function getTeamInfo(uint256 _teamId) external view validTeam(_teamId) returns (
        string memory teamName,
        string memory league,
        address teamManager,
        uint256[] memory athleteIds,
        bool isActive
    ) {
        Team storage team = teams[_teamId];
        return (
            team.teamName,
            team.league,
            team.teamManager,
            team.athleteIds,
            team.isActive
        );
    }

    function getProposalInfo(uint256 _proposalId) external view returns (
        uint256 athleteId,
        uint256 teamId,
        uint256 contractDuration,
        bool isPending,
        bool isApproved,
        address proposer,
        uint256 timestamp
    ) {
        require(_proposalId > 0 && _proposalId <= proposalCounter, "Invalid proposal");
        ContractProposal storage proposal = proposals[_proposalId];
        return (
            proposal.athleteId,
            proposal.teamId,
            proposal.contractDuration,
            proposal.isPending,
            proposal.isApproved,
            proposal.proposer,
            proposal.timestamp
        );
    }

    function startNewSeason() external onlyOwner {
        currentSeason++;
        emit SeasonStarted(currentSeason, block.timestamp);
    }

    function deactivateAthlete(uint256 _athleteId) external validAthlete(_athleteId) {
        require(
            teams[athletes[_athleteId].teamId].teamManager == msg.sender ||
            msg.sender == contractOwner,
            "Not authorized"
        );

        athletes[_athleteId].isActive = false;
        _updateTeamPayroll(athletes[_athleteId].teamId);
    }

    function deactivateTeam(uint256 _teamId) external onlyOwner validTeam(_teamId) {
        teams[_teamId].isActive = false;
        totalTeams--;
    }

    function getCurrentStats() external view returns (
        uint256 season,
        uint256 totalAthletes,
        uint256 activeTeams,
        uint256 totalProposals
    ) {
        return (currentSeason, athleteCounter, totalTeams, proposalCounter);
    }

    function getMyAthletes(address _address) external view returns (uint256[] memory) {
        return athletesByAddress[_address];
    }

    function getMyTeams(address _manager) external view returns (uint256[] memory) {
        return teamsByManager[_manager];
    }
}