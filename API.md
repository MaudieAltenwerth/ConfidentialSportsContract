# API Documentation

## Table of Contents

- [Contract Overview](#contract-overview)
- [Core Functions](#core-functions)
- [Team Management](#team-management)
- [Athlete Management](#athlete-management)
- [Contract Proposals](#contract-proposals)
- [Timeout & Refund Functions](#timeout--refund-functions)
- [View Functions](#view-functions)
- [Admin Functions](#admin-functions)
- [Events](#events)
- [Error Codes](#error-codes)

## Contract Overview

**Contract Name**: `ConfidentialSportsContract`

**Solidity Version**: `^0.8.24`

**License**: MIT

**Inheritance**: `SepoliaConfig`

### Constants

```solidity
uint256 public constant DECRYPTION_TIMEOUT = 1 hours;
uint256 public constant MAX_CONTRACT_DURATION = 10 * 365 days;
uint256 public constant MIN_SALARY = 0.001 ether;
uint256 public constant MAX_SALARY_CAP = 1000000 ether;
uint256 private constant PRIVACY_MULTIPLIER = 1000;
```

## Team Management

### registerTeam

Register a new team with encrypted salary cap.

```solidity
function registerTeam(
    string memory _teamName,
    string memory _league,
    address _teamManager,
    uint32 _salaryCap
) external onlyOwner returns (uint256)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_teamName` | `string` | Team name (1-100 characters) |
| `_league` | `string` | League identifier |
| `_teamManager` | `address` | Address of team manager (non-zero) |
| `_salaryCap` | `uint32` | Salary cap in wei (MIN_SALARY to MAX_SALARY_CAP) |

**Returns:**

| Type | Description |
|------|-------------|
| `uint256` | Team ID |

**Access Control**: Owner only

**Events Emitted**: `TeamRegistered(uint256 indexed teamId, string teamName, address manager)`

**Requirements:**
- Caller must be contract owner
- Team manager address must be non-zero
- Team name must be 1-100 characters
- Salary cap must be within valid range

**Example:**

```javascript
// JavaScript/Web3.js
const teamId = await contract.registerTeam(
    "Champions United",
    "Premier League",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    ethers.parseEther("100000") // 100,000 ETH salary cap
);
```

### deactivateTeam

Deactivate a team (admin only).

```solidity
function deactivateTeam(uint256 _teamId) external onlyOwner validTeam(_teamId)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_teamId` | `uint256` | Valid team ID |

**Access Control**: Owner only

**Side Effects**: Decrements `totalTeams`

## Athlete Management

### registerAthlete

Register an athlete with privacy-preserving salary obfuscation.

```solidity
function registerAthlete(
    string memory _name,
    string memory _position,
    uint256 _teamId,
    address _athleteAddress,
    uint32 _salary,
    uint32 _bonus,
    uint256 _contractDurationMonths
) external returns (uint256)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_name` | `string` | Athlete name (1-100 characters) |
| `_position` | `string` | Position (e.g., "Forward", "Defender") |
| `_teamId` | `uint256` | Valid team ID |
| `_athleteAddress` | `address` | Athlete's wallet address (non-zero) |
| `_salary` | `uint32` | Annual salary in wei (encrypted) |
| `_bonus` | `uint32` | Annual bonus in wei (encrypted) |
| `_contractDurationMonths` | `uint256` | Contract duration (1-120 months) |

**Returns:**

| Type | Description |
|------|-------------|
| `uint256` | Athlete ID |

**Access Control**: Team manager of specified team

**Events Emitted**:
- `AthleteRegistered(uint256 indexed athleteId, string name, uint256 teamId)`
- `PayrollUpdated(uint256 indexed teamId, uint256 timestamp)`

**Requirements:**
- Caller must be team manager
- Team must be valid and active
- Athlete address must be non-zero
- Name must be 1-100 characters
- Salary must be within MIN_SALARY to MAX_SALARY_CAP
- Contract duration must be 1-120 months (max 10 years)

**Privacy Features:**
- Salary encrypted as `euint32`
- Obfuscated salary created with PRIVACY_MULTIPLIER
- FHE permissions granted to athlete and team manager

**Example:**

```javascript
const athleteId = await contract.registerAthlete(
    "John Smith",
    "Midfielder",
    teamId,
    athleteAddress,
    encryptedSalary,    // FHE encrypted value
    encryptedBonus,     // FHE encrypted value
    36                  // 3-year contract
);
```

### updateAthleteSalary

Update athlete salary with privacy protection.

```solidity
function updateAthleteSalary(
    uint256 _athleteId,
    uint32 _newSalary,
    uint32 _newBonus
) external validAthlete(_athleteId)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_athleteId` | `uint256` | Valid athlete ID |
| `_newSalary` | `uint32` | New salary (MIN_SALARY to MAX_SALARY_CAP) |
| `_newBonus` | `uint32` | New bonus amount |

**Access Control**: Team manager, athlete, or contract owner

**Events Emitted**:
- `SalaryUpdated(uint256 indexed athleteId, uint256 timestamp)`
- `PayrollUpdated(uint256 indexed teamId, uint256 timestamp)`

**Side Effects**: Recalculates team payroll

### deactivateAthlete

Deactivate an athlete.

```solidity
function deactivateAthlete(uint256 _athleteId) external validAthlete(_athleteId)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_athleteId` | `uint256` | Valid athlete ID |

**Access Control**: Team manager or contract owner

**Side Effects**: Recalculates team payroll

## Contract Proposals

### proposeContract

Create a new contract proposal using Gateway callback pattern.

```solidity
function proposeContract(
    uint256 _athleteId,
    uint256 _teamId,
    uint32 _proposedSalary,
    uint32 _proposedBonus,
    uint256 _contractDuration
) external returns (uint256)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_athleteId` | `uint256` | Valid athlete ID |
| `_teamId` | `uint256` | Valid team ID |
| `_proposedSalary` | `uint32` | Proposed salary (MIN_SALARY to MAX_SALARY_CAP) |
| `_proposedBonus` | `uint32` | Proposed bonus amount |
| `_contractDuration` | `uint256` | Contract duration in months (1-120) |

**Returns:**

| Type | Description |
|------|-------------|
| `uint256` | Proposal ID |

**Access Control**: Team manager of specified team

**Events Emitted**: `ContractProposed(uint256 indexed proposalId, uint256 athleteId, uint256 teamId)`

**Proposal Lifecycle:**
- Created with `isPending = true`
- Expires after 30 days (`expiryTime`)
- Requires decryption callback before approval
- Can be approved, rejected, or withdrawn

**Example:**

```javascript
const proposalId = await contract.proposeContract(
    athleteId,
    teamId,
    encryptedProposedSalary,
    encryptedProposedBonus,
    48  // 4-year contract
);
```

### requestProposalDecryption

Request Gateway decryption for proposal (required before approval).

```solidity
function requestProposalDecryption(uint256 _proposalId)
    external
    validProposal(_proposalId)
    returns (uint256)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_proposalId` | `uint256` | Valid proposal ID |

**Returns:**

| Type | Description |
|------|-------------|
| `uint256` | Decryption request ID |

**Access Control**: Athlete associated with proposal

**Events Emitted**: `DecryptionRequested(uint256 indexed requestId, string requestType, uint256 targetId)`

**Requirements:**
- Proposal must be pending
- Decryption not already requested
- Caller must be athlete
- Proposal not expired

**Gateway Workflow:**
1. Contract emits `DecryptionRequested` event
2. Gateway monitors and processes request
3. Gateway calls `proposalDecryptionCallback()`
4. Contract updates `callbackReceived = true`
5. Athlete can now approve/reject

### proposalDecryptionCallback

Gateway callback function (internal use by Gateway).

```solidity
function proposalDecryptionCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `requestId` | `uint256` | Decryption request ID |
| `cleartexts` | `bytes` | ABI-encoded decrypted values |
| `decryptionProof` | `bytes` | Cryptographic proof from Gateway |

**Access Control**: Public (Gateway signature verified)

**Events Emitted**: `DecryptionCompleted(uint256 indexed requestId, bool success)`

**Security**: Uses `FHE.checkSignatures()` to verify Gateway authorization

### approveContract

Approve a contract proposal after decryption.

```solidity
function approveContract(uint256 _proposalId) external validProposal(_proposalId)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_proposalId` | `uint256` | Valid proposal ID |

**Access Control**: Athlete associated with proposal

**Events Emitted**:
- `ContractApproved(uint256 indexed proposalId, uint256 athleteId, uint256 teamId)`
- `PayrollUpdated(uint256 indexed teamId, uint256 timestamp)`

**Requirements:**
- Proposal must be pending
- Decryption callback must be completed
- Caller must be athlete
- Proposal not expired

**Side Effects:**
- Updates athlete salary and bonus
- Updates contract start/end dates
- Recalculates team payroll
- Sets `isPending = false`, `isApproved = true`

### rejectContract

Reject a contract proposal.

```solidity
function rejectContract(uint256 _proposalId) external validProposal(_proposalId)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_proposalId` | `uint256` | Valid proposal ID |

**Access Control**: Athlete associated with proposal

**Events Emitted**: `ContractRejected(uint256 indexed proposalId, uint256 athleteId, uint256 reason)`

**Side Effects**: Sets `isPending = false`, `isRejected = true`

## Timeout & Refund Functions

### handleDecryptionTimeout

Handle timeout for stuck decryption requests.

```solidity
function handleDecryptionTimeout(uint256 requestId) external
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `requestId` | `uint256` | Decryption request ID |

**Access Control**: Public (anyone can trigger after timeout)

**Events Emitted**: `DecryptionTimedOut(uint256 indexed requestId, uint256 timestamp)`

**Requirements:**
- Request not already completed
- At least DECRYPTION_TIMEOUT (1 hour) has passed

**Side Effects:**
- Marks request as timed out
- Auto-rejects associated proposal

**Use Case**: Handles Gateway failures or network issues

**Example:**

```javascript
// After 1 hour, if Gateway hasn't responded
await contract.handleDecryptionTimeout(requestId);
```

### emergencyWithdrawProposal

Emergency withdrawal for expired proposals.

```solidity
function emergencyWithdrawProposal(uint256 _proposalId)
    external
    validProposal(_proposalId)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_proposalId` | `uint256` | Valid proposal ID |

**Access Control**: Proposal creator or athlete

**Events Emitted**: `EmergencyWithdrawal(uint256 indexed proposalId, address recipient)`

**Requirements:**
- Proposal must be pending
- Proposal must be expired (past `expiryTime`)
- Caller must be proposer or athlete

**Side Effects**: Sets `isPending = false`, `isRejected = true`

**Use Case**: Recover from stuck proposals after 30-day expiry

## View Functions

### getAthleteInfo

Get public athlete information.

```solidity
function getAthleteInfo(uint256 _athleteId)
    external
    view
    validAthlete(_athleteId)
    returns (
        string memory name,
        string memory position,
        uint256 teamId,
        bool isActive,
        uint256 contractStart,
        uint256 contractEnd,
        address athleteAddress
    )
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_athleteId` | `uint256` | Valid athlete ID |

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | Athlete name |
| `position` | `string` | Playing position |
| `teamId` | `uint256` | Current team ID |
| `isActive` | `bool` | Active status |
| `contractStart` | `uint256` | Contract start timestamp |
| `contractEnd` | `uint256` | Contract end timestamp |
| `athleteAddress` | `address` | Athlete wallet address |

**Note**: Encrypted salary and bonus are NOT returned (privacy protection)

### getTeamInfo

Get public team information.

```solidity
function getTeamInfo(uint256 _teamId)
    external
    view
    validTeam(_teamId)
    returns (
        string memory teamName,
        string memory league,
        address teamManager,
        uint256[] memory athleteIds,
        bool isActive
    )
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_teamId` | `uint256` | Valid team ID |

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `teamName` | `string` | Team name |
| `league` | `string` | League identifier |
| `teamManager` | `address` | Team manager address |
| `athleteIds` | `uint256[]` | Array of athlete IDs |
| `isActive` | `bool` | Active status |

### getProposalInfo

Get proposal information.

```solidity
function getProposalInfo(uint256 _proposalId)
    external
    view
    validProposal(_proposalId)
    returns (
        uint256 athleteId,
        uint256 teamId,
        uint256 contractDuration,
        bool isPending,
        bool isApproved,
        address proposer,
        uint256 timestamp,
        uint256 expiryTime,
        bool callbackReceived
    )
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_proposalId` | `uint256` | Valid proposal ID |

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `athleteId` | `uint256` | Athlete ID |
| `teamId` | `uint256` | Team ID |
| `contractDuration` | `uint256` | Duration in months |
| `isPending` | `bool` | Pending status |
| `isApproved` | `bool` | Approval status |
| `proposer` | `address` | Proposer address |
| `timestamp` | `uint256` | Creation timestamp |
| `expiryTime` | `uint256` | Expiry timestamp |
| `callbackReceived` | `bool` | Decryption callback status |

### getDecryptionStatus

Get decryption request status.

```solidity
function getDecryptionStatus(uint256 requestId)
    external
    view
    returns (
        bool completed,
        bool timedOut,
        uint256 timestamp,
        string memory requestType
    )
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `requestId` | `uint256` | Decryption request ID |

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `completed` | `bool` | Completion status |
| `timedOut` | `bool` | Timeout status |
| `timestamp` | `uint256` | Request timestamp |
| `requestType` | `string` | Type (e.g., "proposal") |

### getCurrentStats

Get current contract statistics.

```solidity
function getCurrentStats()
    external
    view
    returns (
        uint256 season,
        uint256 totalAthletes,
        uint256 activeTeams,
        uint256 totalProposals
    )
```

**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `season` | `uint256` | Current season number |
| `totalAthletes` | `uint256` | Total athletes registered |
| `activeTeams` | `uint256` | Number of active teams |
| `totalProposals` | `uint256` | Total proposals created |

### getMyAthletes

Get athlete IDs for a specific address.

```solidity
function getMyAthletes(address _address)
    external
    view
    returns (uint256[] memory)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_address` | `address` | Athlete address to query |

**Returns:**

| Type | Description |
|------|-------------|
| `uint256[]` | Array of athlete IDs |

### getMyTeams

Get team IDs managed by a specific address.

```solidity
function getMyTeams(address _manager)
    external
    view
    returns (uint256[] memory)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_manager` | `address` | Manager address to query |

**Returns:**

| Type | Description |
|------|-------------|
| `uint256[]` | Array of team IDs |

### checkSalaryCap

Check team salary cap compliance (privacy-preserving).

```solidity
function checkSalaryCap(uint256 _teamId)
    external
    validTeam(_teamId)
    returns (ebool)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `_teamId` | `uint256` | Valid team ID |

**Returns:**

| Type | Description |
|------|-------------|
| `ebool` | Encrypted boolean (true if compliant) |

**Privacy**: Result is encrypted; only team manager can decrypt

**Events Emitted**: `PayrollUpdated` (if payroll recalculated)

## Admin Functions

### startNewSeason

Increment the current season.

```solidity
function startNewSeason() external onlyOwner
```

**Access Control**: Owner only

**Events Emitted**: `SeasonStarted(uint256 indexed season, uint256 timestamp)`

**Side Effects**: Increments `currentSeason`

## Events

### AthleteRegistered

```solidity
event AthleteRegistered(
    uint256 indexed athleteId,
    string name,
    uint256 teamId
)
```

Emitted when a new athlete is registered.

### TeamRegistered

```solidity
event TeamRegistered(
    uint256 indexed teamId,
    string teamName,
    address manager
)
```

Emitted when a new team is registered.

### SalaryUpdated

```solidity
event SalaryUpdated(
    uint256 indexed athleteId,
    uint256 timestamp
)
```

Emitted when an athlete's salary is updated.

### ContractProposed

```solidity
event ContractProposed(
    uint256 indexed proposalId,
    uint256 athleteId,
    uint256 teamId
)
```

Emitted when a contract proposal is created.

### ContractApproved

```solidity
event ContractApproved(
    uint256 indexed proposalId,
    uint256 athleteId,
    uint256 teamId
)
```

Emitted when a contract proposal is approved.

### ContractRejected

```solidity
event ContractRejected(
    uint256 indexed proposalId,
    uint256 athleteId,
    uint256 reason
)
```

Emitted when a contract proposal is rejected.

### PayrollUpdated

```solidity
event PayrollUpdated(
    uint256 indexed teamId,
    uint256 timestamp
)
```

Emitted when a team's payroll is recalculated.

### SeasonStarted

```solidity
event SeasonStarted(
    uint256 indexed season,
    uint256 timestamp
)
```

Emitted when a new season starts.

### DecryptionRequested

```solidity
event DecryptionRequested(
    uint256 indexed requestId,
    string requestType,
    uint256 targetId
)
```

Emitted when a decryption request is submitted to Gateway.

### DecryptionCompleted

```solidity
event DecryptionCompleted(
    uint256 indexed requestId,
    bool success
)
```

Emitted when Gateway completes a decryption request.

### DecryptionTimedOut

```solidity
event DecryptionTimedOut(
    uint256 indexed requestId,
    uint256 timestamp
)
```

Emitted when a decryption request times out.

### RefundIssued

```solidity
event RefundIssued(
    address indexed recipient,
    uint256 amount,
    string reason
)
```

Emitted when a refund is issued (reserved for future use).

### EmergencyWithdrawal

```solidity
event EmergencyWithdrawal(
    uint256 indexed proposalId,
    address recipient
)
```

Emitted when an emergency withdrawal is executed.

## Error Codes

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `"Not authorized: owner only"` | Caller is not contract owner | Use owner account |
| `"Not authorized: team manager only"` | Caller is not team manager | Use team manager account |
| `"Not authorized: athlete only"` | Caller is not athlete | Use athlete account |
| `"Invalid team ID"` | Team ID out of range | Use valid team ID |
| `"Team is inactive"` | Team has been deactivated | Use active team |
| `"Invalid athlete ID"` | Athlete ID out of range | Use valid athlete ID |
| `"Athlete is inactive"` | Athlete has been deactivated | Use active athlete |
| `"Invalid proposal ID"` | Proposal ID out of range | Use valid proposal ID |
| `"Input out of valid range"` | Input parameter outside bounds | Check MIN/MAX constants |
| `"Invalid manager address"` | Zero address provided | Provide valid address |
| `"Invalid team name"` | Name too short/long | Use 1-100 characters |
| `"Proposal not pending"` | Proposal already processed | Check proposal status |
| `"Decryption already requested"` | Cannot request twice | Wait for callback |
| `"Proposal expired"` | Past 30-day expiry | Use emergency withdrawal |
| `"Request already processed"` | Callback already called | Check status |
| `"Request timed out"` | Past DECRYPTION_TIMEOUT | Handle timeout |
| `"Timeout not reached"` | Too early to trigger timeout | Wait for timeout period |
| `"Not expired yet"` | Proposal still active | Wait for expiry |
| `"Decryption not completed"` | Callback not received | Request decryption first |

## Integration Examples

### Complete Workflow Example

```javascript
// 1. Register Team (Owner)
const teamId = await contract.registerTeam(
    "Elite FC",
    "Premier League",
    managerAddress,
    ethers.parseEther("50000")
);

// 2. Register Athlete (Team Manager)
const encryptedSalary = await fheInstance.encrypt32(ethers.parseEther("5000"));
const encryptedBonus = await fheInstance.encrypt32(ethers.parseEther("1000"));

const athleteId = await contract.connect(manager).registerAthlete(
    "Jane Doe",
    "Striker",
    teamId,
    athleteAddress,
    encryptedSalary,
    encryptedBonus,
    48  // 4 years
);

// 3. Propose Contract (Team Manager)
const newEncryptedSalary = await fheInstance.encrypt32(ethers.parseEther("7000"));
const newEncryptedBonus = await fheInstance.encrypt32(ethers.parseEther("1500"));

const proposalId = await contract.connect(manager).proposeContract(
    athleteId,
    teamId,
    newEncryptedSalary,
    newEncryptedBonus,
    36  // 3 years
);

// 4. Request Decryption (Athlete)
const requestId = await contract.connect(athlete).requestProposalDecryption(proposalId);

// 5. Wait for Gateway Callback
contract.on('DecryptionCompleted', async (reqId, success) => {
    if (reqId === requestId && success) {
        // 6. Approve Contract (Athlete)
        await contract.connect(athlete).approveContract(proposalId);
    }
});

// Alternative: Handle Timeout
setTimeout(async () => {
    const status = await contract.getDecryptionStatus(requestId);
    if (!status.completed && !status.timedOut) {
        await contract.handleDecryptionTimeout(requestId);
        await contract.emergencyWithdrawProposal(proposalId);
    }
}, 3600000); // 1 hour
```

### Monitoring Events

```javascript
// Monitor all proposal events
contract.on('ContractProposed', (proposalId, athleteId, teamId) => {
    console.log(`New proposal ${proposalId} for athlete ${athleteId}`);
});

contract.on('DecryptionRequested', (requestId, type, targetId) => {
    console.log(`Decryption requested: ${requestId} for ${type} ${targetId}`);
});

contract.on('DecryptionCompleted', (requestId, success) => {
    console.log(`Decryption ${requestId} completed: ${success}`);
});

contract.on('DecryptionTimedOut', (requestId, timestamp) => {
    console.log(`Decryption ${requestId} timed out at ${timestamp}`);
});

contract.on('EmergencyWithdrawal', (proposalId, recipient) => {
    console.log(`Emergency withdrawal for proposal ${proposalId}`);
});
```

## Gas Optimization Tips

1. **Batch Operations**: Register multiple athletes in a single session
2. **Minimize Decryptions**: Only decrypt when necessary
3. **Use View Functions**: Query data without transactions
4. **Event Monitoring**: Use events instead of polling view functions
5. **Efficient Permissions**: Grant FHE permissions in batch

## Security Best Practices

1. **Input Validation**: Always check bounds before submitting
2. **Access Control**: Verify correct role before calling restricted functions
3. **Timeout Handling**: Implement timeout fallbacks in frontend
4. **Emergency Recovery**: Monitor expiry times and enable emergency withdrawals
5. **Event Verification**: Validate events before taking action

## Support

For questions or issues with the API, please refer to:
- [Architecture Documentation](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)
