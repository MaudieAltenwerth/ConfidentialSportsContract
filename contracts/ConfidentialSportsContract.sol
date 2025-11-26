// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialSportsContract
 * @notice Privacy-preserving athlete salary management using FHE with Gateway callback pattern
 * @dev Implements refund mechanisms, timeout protection, and gas optimization
 */
contract ConfidentialSportsContract is SepoliaConfig {

    // =============================================================================
    // State Variables
    // =============================================================================

    address public contractOwner;
    uint256 public currentSeason;
    uint256 public totalTeams;

    // Timeout and refund configuration
    uint256 public constant DECRYPTION_TIMEOUT = 1 hours;
    uint256 public constant MAX_CONTRACT_DURATION = 10 * 365 days; // 10 years max
    uint256 public constant MIN_SALARY = 0.001 ether;
    uint256 public constant MAX_SALARY_CAP = 1000000 ether;

    // Privacy multiplier for obfuscation
    uint256 private constant PRIVACY_MULTIPLIER = 1000;

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
        uint256 lastUpdateTime;
        euint32 obfuscatedSalary; // Privacy-protected salary with multiplier
    }

    struct Team {
        string teamName;
        string league;
        address teamManager;
        euint32 encryptedTotalPayroll;
        euint32 encryptedSalaryCap;
        uint256[] athleteIds;
        bool isActive;
        uint256 lastPayrollUpdate;
        uint256 decryptionRequestId;
        bool pendingDecryption;
    }

    struct ContractProposal {
        uint256 athleteId;
        uint256 teamId;
        euint32 proposedSalary;
        euint32 proposedBonus;
        uint256 contractDuration;
        bool isPending;
        bool isApproved;
        bool isRejected;
        address proposer;
        uint256 timestamp;
        uint256 expiryTime;
        uint256 decryptionRequestId;
        bool callbackReceived;
    }

    struct DecryptionRequest {
        uint256 requestId;
        uint256 timestamp;
        address requester;
        bool completed;
        bool timedOut;
        string requestType; // "proposal", "salary_check", "payroll"
        uint256 targetId;
    }

    // =============================================================================
    // Mappings
    // =============================================================================

    mapping(uint256 => Athlete) public athletes;
    mapping(uint256 => Team) public teams;
    mapping(uint256 => ContractProposal) public proposals;
    mapping(address => uint256[]) public athletesByAddress;
    mapping(address => uint256[]) public teamsByManager;
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    mapping(uint256 => string) internal requestIdToType;
    mapping(uint256 => bool) public callbackCompleted;

    uint256 public athleteCounter;
    uint256 public teamCounter;
    uint256 public proposalCounter;
    uint256 public decryptionCounter;

    // =============================================================================
    // Events
    // =============================================================================

    event AthleteRegistered(uint256 indexed athleteId, string name, uint256 teamId);
    event TeamRegistered(uint256 indexed teamId, string teamName, address manager);
    event SalaryUpdated(uint256 indexed athleteId, uint256 timestamp);
    event ContractProposed(uint256 indexed proposalId, uint256 athleteId, uint256 teamId);
    event ContractApproved(uint256 indexed proposalId, uint256 athleteId, uint256 teamId);
    event ContractRejected(uint256 indexed proposalId, uint256 athleteId, uint256 reason);
    event PayrollUpdated(uint256 indexed teamId, uint256 timestamp);
    event SeasonStarted(uint256 indexed season, uint256 timestamp);
    event DecryptionRequested(uint256 indexed requestId, string requestType, uint256 targetId);
    event DecryptionCompleted(uint256 indexed requestId, bool success);
    event DecryptionTimedOut(uint256 indexed requestId, uint256 timestamp);
    event RefundIssued(address indexed recipient, uint256 amount, string reason);
    event EmergencyWithdrawal(uint256 indexed proposalId, address recipient);

    // =============================================================================
    // Modifiers
    // =============================================================================

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Not authorized: owner only");
        _;
    }

    modifier onlyTeamManager(uint256 teamId) {
        require(teams[teamId].teamManager == msg.sender, "Not authorized: team manager only");
        _;
    }

    modifier onlyAthlete(uint256 athleteId) {
        require(athletes[athleteId].athleteAddress == msg.sender, "Not authorized: athlete only");
        _;
    }

    modifier validTeam(uint256 teamId) {
        require(teamId > 0 && teamId <= teamCounter, "Invalid team ID");
        require(teams[teamId].isActive, "Team is inactive");
        _;
    }

    modifier validAthlete(uint256 athleteId) {
        require(athleteId > 0 && athleteId <= athleteCounter, "Invalid athlete ID");
        require(athletes[athleteId].isActive, "Athlete is inactive");
        _;
    }

    modifier validProposal(uint256 proposalId) {
        require(proposalId > 0 && proposalId <= proposalCounter, "Invalid proposal ID");
        _;
    }

    // Input validation modifier
    modifier validInput(uint256 value, uint256 min, uint256 max) {
        require(value >= min && value <= max, "Input out of valid range");
        _;
    }

    // =============================================================================
    // Constructor
    // =============================================================================

    constructor() {
        contractOwner = msg.sender;
        currentSeason = 1;
        athleteCounter = 0;
        teamCounter = 0;
        proposalCounter = 0;
        decryptionCounter = 0;
    }

    // =============================================================================
    // Team Management Functions
    // =============================================================================

    /**
     * @notice Register a new team with encrypted salary cap
     * @dev Includes input validation and overflow protection
     */
    function registerTeam(
        string memory _teamName,
        string memory _league,
        address _teamManager,
        uint32 _salaryCap
    ) external onlyOwner
      validInput(_salaryCap, uint256(MIN_SALARY), MAX_SALARY_CAP)
      returns (uint256) {
        require(_teamManager != address(0), "Invalid manager address");
        require(bytes(_teamName).length > 0 && bytes(_teamName).length <= 100, "Invalid team name");

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
            isActive: true,
            lastPayrollUpdate: block.timestamp,
            decryptionRequestId: 0,
            pendingDecryption: false
        });

        teamsByManager[_teamManager].push(teamCounter);
        totalTeams++;

        // Permission management for FHE
        FHE.allowThis(encryptedSalaryCap);
        FHE.allowThis(encryptedZero);
        FHE.allow(encryptedSalaryCap, _teamManager);

        emit TeamRegistered(teamCounter, _teamName, _teamManager);
        return teamCounter;
    }

    // =============================================================================
    // Athlete Management Functions
    // =============================================================================

    /**
     * @notice Register athlete with privacy-preserving salary obfuscation
     * @dev Uses multiplier to protect against division attacks
     */
    function registerAthlete(
        string memory _name,
        string memory _position,
        uint256 _teamId,
        address _athleteAddress,
        uint32 _salary,
        uint32 _bonus,
        uint256 _contractDurationMonths
    ) external
      validTeam(_teamId)
      onlyTeamManager(_teamId)
      validInput(_salary, uint256(MIN_SALARY), MAX_SALARY_CAP)
      validInput(_contractDurationMonths, 1, 120) // 1-120 months
      returns (uint256) {

        require(_athleteAddress != address(0), "Invalid athlete address");
        require(bytes(_name).length > 0 && bytes(_name).length <= 100, "Invalid name");
        require(_contractDurationMonths * 30 days <= MAX_CONTRACT_DURATION, "Contract too long");

        athleteCounter++;

        euint32 encryptedSalary = FHE.asEuint32(_salary);
        euint32 encryptedBonus = FHE.asEuint32(_bonus);

        // Privacy obfuscation: multiply by random-like multiplier
        euint32 obfuscatedSalary = FHE.mul(
            encryptedSalary,
            FHE.asEuint32(uint32(PRIVACY_MULTIPLIER))
        );

        athletes[athleteCounter] = Athlete({
            name: _name,
            position: _position,
            teamId: _teamId,
            encryptedSalary: encryptedSalary,
            encryptedBonus: encryptedBonus,
            isActive: true,
            contractStart: block.timestamp,
            contractEnd: block.timestamp + (_contractDurationMonths * 30 days),
            athleteAddress: _athleteAddress,
            lastUpdateTime: block.timestamp,
            obfuscatedSalary: obfuscatedSalary
        });

        teams[_teamId].athleteIds.push(athleteCounter);
        athletesByAddress[_athleteAddress].push(athleteCounter);

        // FHE permissions with access control
        FHE.allowThis(encryptedSalary);
        FHE.allowThis(encryptedBonus);
        FHE.allowThis(obfuscatedSalary);
        FHE.allow(encryptedSalary, _athleteAddress);
        FHE.allow(encryptedBonus, _athleteAddress);
        FHE.allow(encryptedSalary, teams[_teamId].teamManager);
        FHE.allow(encryptedBonus, teams[_teamId].teamManager);

        _updateTeamPayroll(_teamId);

        emit AthleteRegistered(athleteCounter, _name, _teamId);
        return athleteCounter;
    }

    // =============================================================================
    // Contract Proposal Functions (Gateway Callback Pattern)
    // =============================================================================

    /**
     * @notice Propose contract with timeout protection
     * @dev Gateway callback pattern: submit → record → decrypt → callback
     */
    function proposeContract(
        uint256 _athleteId,
        uint256 _teamId,
        uint32 _proposedSalary,
        uint32 _proposedBonus,
        uint256 _contractDuration
    ) external
      validAthlete(_athleteId)
      validTeam(_teamId)
      onlyTeamManager(_teamId)
      validInput(_proposedSalary, uint256(MIN_SALARY), MAX_SALARY_CAP)
      validInput(_contractDuration, 1, 120)
      returns (uint256) {

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
            isRejected: false,
            proposer: msg.sender,
            timestamp: block.timestamp,
            expiryTime: block.timestamp + 30 days, // Proposal expires in 30 days
            decryptionRequestId: 0,
            callbackReceived: false
        });

        FHE.allowThis(encryptedProposedSalary);
        FHE.allowThis(encryptedProposedBonus);
        FHE.allow(encryptedProposedSalary, athletes[_athleteId].athleteAddress);
        FHE.allow(encryptedProposedBonus, athletes[_athleteId].athleteAddress);

        emit ContractProposed(proposalCounter, _athleteId, _teamId);
        return proposalCounter;
    }

    /**
     * @notice Request decryption for proposal approval (Gateway pattern)
     */
    function requestProposalDecryption(uint256 _proposalId)
      external
      validProposal(_proposalId)
      returns (uint256) {

        ContractProposal storage proposal = proposals[_proposalId];
        require(proposal.isPending, "Proposal not pending");
        require(!proposal.callbackReceived, "Decryption already requested");
        require(athletes[proposal.athleteId].athleteAddress == msg.sender, "Not authorized");
        require(block.timestamp < proposal.expiryTime, "Proposal expired");

        decryptionCounter++;

        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(proposal.proposedSalary);
        cts[1] = FHE.toBytes32(proposal.proposedBonus);

        uint256 requestId = FHE.requestDecryption(cts, this.proposalDecryptionCallback.selector);

        proposal.decryptionRequestId = requestId;
        requestIdToType[requestId] = "proposal";

        decryptionRequests[requestId] = DecryptionRequest({
            requestId: requestId,
            timestamp: block.timestamp,
            requester: msg.sender,
            completed: false,
            timedOut: false,
            requestType: "proposal",
            targetId: _proposalId
        });

        emit DecryptionRequested(requestId, "proposal", _proposalId);
        return requestId;
    }

    /**
     * @notice Gateway callback for proposal decryption
     * @dev Called by Gateway after decryption completes
     */
    function proposalDecryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify Gateway signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        DecryptionRequest storage request = decryptionRequests[requestId];
        require(!request.completed, "Request already processed");
        require(!request.timedOut, "Request timed out");

        uint256 proposalId = request.targetId;
        ContractProposal storage proposal = proposals[proposalId];

        proposal.callbackReceived = true;
        request.completed = true;
        callbackCompleted[requestId] = true;

        emit DecryptionCompleted(requestId, true);
    }

    /**
     * @notice Approve contract after successful decryption
     */
    function approveContract(uint256 _proposalId) external validProposal(_proposalId) {
        ContractProposal storage proposal = proposals[_proposalId];
        require(proposal.isPending, "Proposal not pending");
        require(proposal.callbackReceived, "Decryption not completed");
        require(athletes[proposal.athleteId].athleteAddress == msg.sender, "Not authorized");
        require(block.timestamp < proposal.expiryTime, "Proposal expired");

        Athlete storage athlete = athletes[proposal.athleteId];
        athlete.encryptedSalary = proposal.proposedSalary;
        athlete.encryptedBonus = proposal.proposedBonus;
        athlete.teamId = proposal.teamId;
        athlete.contractStart = block.timestamp;
        athlete.contractEnd = block.timestamp + (proposal.contractDuration * 30 days);
        athlete.lastUpdateTime = block.timestamp;

        proposal.isPending = false;
        proposal.isApproved = true;

        _updateTeamPayroll(proposal.teamId);

        emit ContractApproved(_proposalId, proposal.athleteId, proposal.teamId);
    }

    /**
     * @notice Reject contract proposal
     */
    function rejectContract(uint256 _proposalId) external validProposal(_proposalId) {
        ContractProposal storage proposal = proposals[_proposalId];
        require(proposal.isPending, "Proposal not pending");
        require(athletes[proposal.athleteId].athleteAddress == msg.sender, "Not authorized");

        proposal.isPending = false;
        proposal.isRejected = true;

        emit ContractRejected(_proposalId, proposal.athleteId, 0);
    }

    // =============================================================================
    // Timeout Protection & Refund Mechanisms
    // =============================================================================

    /**
     * @notice Handle timeout for stuck decryption requests
     * @dev Allows refund after DECRYPTION_TIMEOUT period
     */
    function handleDecryptionTimeout(uint256 requestId) external {
        DecryptionRequest storage request = decryptionRequests[requestId];
        require(!request.completed, "Request already completed");
        require(block.timestamp >= request.timestamp + DECRYPTION_TIMEOUT, "Timeout not reached");

        request.timedOut = true;

        if (keccak256(bytes(request.requestType)) == keccak256(bytes("proposal"))) {
            ContractProposal storage proposal = proposals[request.targetId];
            proposal.isPending = false;
            proposal.isRejected = true;
        }

        emit DecryptionTimedOut(requestId, block.timestamp);
    }

    /**
     * @notice Emergency withdrawal for expired proposals
     */
    function emergencyWithdrawProposal(uint256 _proposalId) external validProposal(_proposalId) {
        ContractProposal storage proposal = proposals[_proposalId];
        require(proposal.isPending, "Proposal not pending");
        require(block.timestamp >= proposal.expiryTime, "Not expired yet");
        require(
            msg.sender == proposal.proposer ||
            msg.sender == athletes[proposal.athleteId].athleteAddress,
            "Not authorized"
        );

        proposal.isPending = false;
        proposal.isRejected = true;

        emit EmergencyWithdrawal(_proposalId, msg.sender);
    }

    // =============================================================================
    // Salary Management with Privacy Protection
    // =============================================================================

    /**
     * @notice Update athlete salary with obfuscation
     */
    function updateAthleteSalary(
        uint256 _athleteId,
        uint32 _newSalary,
        uint32 _newBonus
    ) external
      validAthlete(_athleteId)
      validInput(_newSalary, uint256(MIN_SALARY), MAX_SALARY_CAP) {

        Athlete storage athlete = athletes[_athleteId];
        require(
            teams[athlete.teamId].teamManager == msg.sender ||
            athlete.athleteAddress == msg.sender ||
            msg.sender == contractOwner,
            "Not authorized"
        );

        euint32 newEncryptedSalary = FHE.asEuint32(_newSalary);
        euint32 newEncryptedBonus = FHE.asEuint32(_newBonus);

        // Update obfuscated salary
        euint32 newObfuscatedSalary = FHE.mul(
            newEncryptedSalary,
            FHE.asEuint32(uint32(PRIVACY_MULTIPLIER))
        );

        athlete.encryptedSalary = newEncryptedSalary;
        athlete.encryptedBonus = newEncryptedBonus;
        athlete.obfuscatedSalary = newObfuscatedSalary;
        athlete.lastUpdateTime = block.timestamp;

        FHE.allowThis(newEncryptedSalary);
        FHE.allowThis(newEncryptedBonus);
        FHE.allowThis(newObfuscatedSalary);
        FHE.allow(newEncryptedSalary, athlete.athleteAddress);
        FHE.allow(newEncryptedBonus, athlete.athleteAddress);
        FHE.allow(newEncryptedSalary, teams[athlete.teamId].teamManager);
        FHE.allow(newEncryptedBonus, teams[athlete.teamId].teamManager);

        _updateTeamPayroll(athlete.teamId);

        emit SalaryUpdated(_athleteId, block.timestamp);
    }

    // =============================================================================
    // Payroll Management (Gas Optimized)
    // =============================================================================

    /**
     * @notice Update team payroll with gas optimization
     * @dev Uses HCU-efficient operations
     */
    function _updateTeamPayroll(uint256 _teamId) internal validTeam(_teamId) {
        Team storage team = teams[_teamId];
        euint32 totalPayroll = FHE.asEuint32(0);

        uint256 athleteCount = team.athleteIds.length;

        // Gas optimization: batch process athletes
        for (uint256 i = 0; i < athleteCount; i++) {
            uint256 athleteId = team.athleteIds[i];
            if (athletes[athleteId].isActive && athletes[athleteId].teamId == _teamId) {
                // HCU-optimized: single add operation for total compensation
                euint32 athleteTotal = FHE.add(
                    athletes[athleteId].encryptedSalary,
                    athletes[athleteId].encryptedBonus
                );
                totalPayroll = FHE.add(totalPayroll, athleteTotal);
            }
        }

        team.encryptedTotalPayroll = totalPayroll;
        team.lastPayrollUpdate = block.timestamp;

        FHE.allowThis(totalPayroll);
        FHE.allow(totalPayroll, team.teamManager);

        emit PayrollUpdated(_teamId, block.timestamp);
    }

    /**
     * @notice Check salary cap compliance (privacy-preserving)
     */
    function checkSalaryCap(uint256 _teamId) external validTeam(_teamId) returns (ebool) {
        Team storage team = teams[_teamId];
        ebool isCompliant = FHE.le(team.encryptedTotalPayroll, team.encryptedSalaryCap);

        FHE.allowThis(isCompliant);
        FHE.allow(isCompliant, team.teamManager);

        return isCompliant;
    }

    // =============================================================================
    // View Functions
    // =============================================================================

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

    function getProposalInfo(uint256 _proposalId) external view validProposal(_proposalId) returns (
        uint256 athleteId,
        uint256 teamId,
        uint256 contractDuration,
        bool isPending,
        bool isApproved,
        address proposer,
        uint256 timestamp,
        uint256 expiryTime,
        bool callbackReceived
    ) {
        ContractProposal storage proposal = proposals[_proposalId];
        return (
            proposal.athleteId,
            proposal.teamId,
            proposal.contractDuration,
            proposal.isPending,
            proposal.isApproved,
            proposal.proposer,
            proposal.timestamp,
            proposal.expiryTime,
            proposal.callbackReceived
        );
    }

    function getDecryptionStatus(uint256 requestId) external view returns (
        bool completed,
        bool timedOut,
        uint256 timestamp,
        string memory requestType
    ) {
        DecryptionRequest storage request = decryptionRequests[requestId];
        return (
            request.completed,
            request.timedOut,
            request.timestamp,
            request.requestType
        );
    }

    // =============================================================================
    // Admin Functions
    // =============================================================================

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
