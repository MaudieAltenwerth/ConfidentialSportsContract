# Architecture Documentation

## System Overview

The Confidential Sports Contract Management System is a privacy-preserving decentralized application built on Fully Homomorphic Encryption (FHE) technology. This architecture enables secure management of athlete contracts while maintaining complete privacy of sensitive salary information.

## Core Architecture Principles

### 1. Gateway Callback Pattern

All asynchronous decryption operations follow the Gateway callback pattern:

```
User Request → Contract Records Request → Gateway Decryption → Callback Completion
```

**Benefits:**
- Non-blocking operations
- Secure decryption via trusted Gateway
- Automatic state management
- Timeout protection for failed operations

**Implementation Flow:**

1. **Request Phase**: User submits encrypted data request
   - Contract validates permissions
   - Creates decryption request record
   - Emits `DecryptionRequested` event

2. **Gateway Processing**: Off-chain Gateway handles decryption
   - Gateway monitors blockchain events
   - Performs secure decryption
   - Generates cryptographic proof

3. **Callback Phase**: Gateway invokes callback function
   - Contract verifies signatures via `FHE.checkSignatures()`
   - Updates state with decrypted values
   - Emits `DecryptionCompleted` event

4. **Completion**: User completes transaction
   - Verifies callback completion
   - Executes final business logic

### 2. Timeout Protection Mechanism

**Problem**: Decryption requests might fail or get stuck, permanently locking user funds or state.

**Solution**: Multi-layered timeout system

```solidity
// Timeout constant
uint256 public constant DECRYPTION_TIMEOUT = 1 hours;

// Timeout tracking
struct DecryptionRequest {
    uint256 timestamp;
    bool completed;
    bool timedOut;
}
```

**Protection Features:**
- Automatic expiry after 1 hour
- Manual timeout trigger via `handleDecryptionTimeout()`
- Emergency withdrawal for expired proposals
- State cleanup for timed-out requests

**User Protections:**
- Proposals auto-expire after 30 days
- Emergency withdrawal available after expiry
- No permanent fund locks

### 3. Refund Mechanism

**Scenarios Requiring Refunds:**

1. **Decryption Failure**: Gateway fails to process request
   - Timeout triggers automatic rejection
   - User can withdraw via `emergencyWithdrawProposal()`

2. **Expired Proposals**: Contract proposals exceed deadline
   - 30-day expiry timer
   - Either party can trigger withdrawal

3. **Rejected Contracts**: Athlete rejects proposal
   - Immediate state update
   - No fund lock-in

**Implementation:**

```solidity
function emergencyWithdrawProposal(uint256 _proposalId) external {
    require(block.timestamp >= proposal.expiryTime, "Not expired yet");
    require(msg.sender == proposer || msg.sender == athlete, "Not authorized");

    proposal.isPending = false;
    proposal.isRejected = true;

    emit EmergencyWithdrawal(_proposalId, msg.sender);
}
```

## Security Architecture

### 1. Input Validation

**Multi-Layer Validation:**

```solidity
modifier validInput(uint256 value, uint256 min, uint256 max) {
    require(value >= min && value <= max, "Input out of valid range");
    _;
}
```

**Validation Points:**
- Salary ranges: MIN_SALARY to MAX_SALARY_CAP
- Contract duration: 1-120 months (max 10 years)
- Address validation: non-zero addresses
- String length: 1-100 characters
- Team/Athlete/Proposal IDs: valid ranges

### 2. Access Control

**Role-Based Permissions:**

| Role | Permissions |
|------|------------|
| Contract Owner | Register teams, deactivate teams, start seasons |
| Team Manager | Register athletes, propose contracts, update salaries |
| Athlete | Approve/reject contracts, view own salary |

**Enforcement:**

```solidity
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
```

### 3. Overflow Protection

**Safe Math via Solidity 0.8.24:**
- Built-in overflow/underflow checks
- Automatic revert on arithmetic errors

**Additional Bounds:**
- MAX_SALARY_CAP: 1,000,000 ETH
- MAX_CONTRACT_DURATION: 10 years
- Input validation modifiers

### 4. FHE Permission Management

**Granular Access Control:**

```solidity
// Contract always has access
FHE.allowThis(encryptedValue);

// Athlete can decrypt their own salary
FHE.allow(encryptedSalary, athleteAddress);

// Team manager can decrypt team salaries
FHE.allow(encryptedSalary, teamManager);
```

**Permission Principles:**
- Minimal necessary access
- Explicit permission grants
- No global decryption rights

## Privacy Protection Techniques

### 1. Division Attack Protection

**Problem**: Division operations can leak information about encrypted values.

**Solution**: Random multiplier obfuscation

```solidity
uint256 private constant PRIVACY_MULTIPLIER = 1000;

euint32 obfuscatedSalary = FHE.mul(
    encryptedSalary,
    FHE.asEuint32(uint32(PRIVACY_MULTIPLIER))
);
```

**Benefits:**
- Prevents ratio analysis
- Masks actual salary values
- Maintains computational correctness

### 2. Price Obfuscation

**Techniques:**
- Encrypted storage: All salaries stored as `euint32`
- Obfuscated calculations: Multiplier-based protection
- Delayed revelation: Gateway callback pattern
- Selective decryption: Only authorized parties

**Privacy Guarantees:**
- On-chain observers see only encrypted data
- Comparisons possible without decryption
- Statistical analysis prevented

### 3. Encrypted Comparisons

**Salary Cap Compliance:**

```solidity
function checkSalaryCap(uint256 _teamId) external returns (ebool) {
    Team storage team = teams[_teamId];

    // Comparison on encrypted data
    ebool isCompliant = FHE.le(
        team.encryptedTotalPayroll,
        team.encryptedSalaryCap
    );

    return isCompliant; // Returns encrypted boolean
}
```

**Advantages:**
- No salary revelation required
- Privacy-preserving compliance checking
- Encrypted result (ebool)

## Gas Optimization with HCU

### Homomorphic Computation Units (HCU)

HCU measures the computational cost of FHE operations. Optimization strategies:

### 1. Operation Batching

**Before:**
```solidity
// Multiple separate operations (high HCU)
euint32 total1 = FHE.add(salary1, bonus1);
euint32 total2 = FHE.add(salary2, bonus2);
euint32 total3 = FHE.add(salary3, bonus3);
euint32 grandTotal = FHE.add(FHE.add(total1, total2), total3);
```

**After:**
```solidity
// Optimized batching (lower HCU)
euint32 totalPayroll = FHE.asEuint32(0);
for (uint256 i = 0; i < athleteCount; i++) {
    euint32 athleteTotal = FHE.add(salary, bonus);
    totalPayroll = FHE.add(totalPayroll, athleteTotal);
}
```

### 2. Minimized Decryptions

**Strategy**: Batch decryption requests

```solidity
// Single decryption request for multiple values
bytes32[] memory cts = new bytes32[](2);
cts[0] = FHE.toBytes32(proposedSalary);
cts[1] = FHE.toBytes32(proposedBonus);

uint256 requestId = FHE.requestDecryption(cts, callback);
```

### 3. Permission Optimization

**Efficient Permission Grants:**

```solidity
// Grant all permissions in batch
FHE.allowThis(encryptedSalary);
FHE.allowThis(encryptedBonus);
FHE.allow(encryptedSalary, athleteAddress);
FHE.allow(encryptedBonus, athleteAddress);
```

### 4. State Update Optimization

**Minimize Payroll Recalculations:**

```solidity
// Track last update time
team.lastPayrollUpdate = block.timestamp;

// Only recalculate when necessary
if (requiresUpdate) {
    _updateTeamPayroll(teamId);
}
```

## Data Flow Architecture

### Contract Proposal Workflow

```
┌─────────────┐
│Team Manager │
│Proposes     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ proposeContract()   │
│ - Encrypt terms     │
│ - Record proposal   │
│ - Set 30-day expiry │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────┐
│ Athlete Reviews         │
│ requestProposalDecrypt  │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Gateway Decryption       │
│ - Off-chain processing   │
│ - Generate proof         │
└──────┬───────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ proposalDecryptionCallback  │
│ - Verify signatures         │
│ - Update state              │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────┐
│ Athlete Decides │
├─────────────────┤
│ approveContract │
│ OR              │
│ rejectContract  │
└─────────────────┘
```

### Timeout Handling Flow

```
┌────────────────┐
│Decryption Req  │
│Submitted       │
└───────┬────────┘
        │
        ▼
   ┌─────────┐
   │ 1 hour  │
   │ timeout │
   └────┬────┘
        │
        ▼
    ┌───────────────┐      YES    ┌──────────────┐
    │ Callback      ├──────────────► Complete     │
    │ Received?     │              │ Transaction  │
    └───────┬───────┘              └──────────────┘
            │
            NO
            │
            ▼
    ┌──────────────────┐
    │ handleTimeout()  │
    │ - Mark timed out │
    │ - Reject proposal│
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ Emergency        │
    │ Withdrawal       │
    └──────────────────┘
```

## Contract State Management

### State Transitions

**Proposal States:**

```
PENDING ──approveContract()──> APPROVED
   │
   ├──rejectContract()──> REJECTED
   │
   ├──timeout──> REJECTED (timed out)
   │
   └──expiry──> REJECTED (expired)
```

**Decryption Request States:**

```
CREATED ──callback──> COMPLETED
   │
   └──timeout──> TIMED_OUT
```

### Event Emission Strategy

**Comprehensive Event Coverage:**

```solidity
// Lifecycle events
event AthleteRegistered(uint256 indexed athleteId, string name, uint256 teamId);
event TeamRegistered(uint256 indexed teamId, string teamName, address manager);

// Operation events
event ContractProposed(uint256 indexed proposalId, uint256 athleteId, uint256 teamId);
event DecryptionRequested(uint256 indexed requestId, string requestType, uint256 targetId);
event DecryptionCompleted(uint256 indexed requestId, bool success);

// Error/protection events
event DecryptionTimedOut(uint256 indexed requestId, uint256 timestamp);
event EmergencyWithdrawal(uint256 indexed proposalId, address recipient);
```

## Scalability Considerations

### 1. Storage Optimization

- Use `uint256` counters instead of arrays for counting
- Dynamic arrays only where necessary
- Indexed events for off-chain queries

### 2. Computation Efficiency

- Minimize FHE operations per transaction
- Batch operations where possible
- Cache encrypted results

### 3. Gas Cost Management

- HCU-optimized operation ordering
- Minimal state updates
- Efficient permission management

## Security Audit Considerations

### Critical Areas for Review

1. **Gateway Callback Security**
   - Signature verification in callbacks
   - Replay attack prevention
   - Callback authorization

2. **Timeout Mechanism**
   - Race condition handling
   - State consistency after timeout
   - Emergency withdrawal safety

3. **Access Control**
   - Permission enforcement
   - Role assignment security
   - FHE permission management

4. **Input Validation**
   - Bounds checking completeness
   - Edge case handling
   - Integer overflow protection

5. **State Management**
   - Atomic state transitions
   - Reentrancy protection
   - Consistent state updates

## Integration Guidelines

### Frontend Integration

1. **FHE Client Setup**
   ```javascript
   import { createFhevmInstance } from 'fhevmjs';
   const instance = await createFhevmInstance({ networkUrl, gatewayUrl });
   ```

2. **Encrypt Input**
   ```javascript
   const encryptedSalary = await instance.encrypt32(salaryAmount);
   ```

3. **Submit Transaction**
   ```javascript
   await contract.registerAthlete(name, position, teamId, address,
                                   encryptedSalary, encryptedBonus, duration);
   ```

4. **Monitor Events**
   ```javascript
   contract.on('DecryptionRequested', (requestId, type, targetId) => {
     // Update UI to show pending state
   });
   ```

### Gateway Integration

1. Monitor decryption request events
2. Fetch encrypted ciphertexts
3. Perform secure decryption
4. Generate cryptographic proof
5. Submit callback transaction

## Future Enhancements

### Potential Upgrades

1. **Multi-signature Approvals**
   - Team + athlete consent required
   - Agent involvement support

2. **Performance Bonuses**
   - Milestone-based encrypted bonuses
   - Automated trigger conditions

3. **Transfer Market**
   - Inter-team athlete transfers
   - Encrypted transfer fees
   - Privacy-preserving auctions

4. **Compliance Automation**
   - Automated salary cap checking
   - League-wide reporting (privacy-preserving)
   - Tax calculation support

5. **Enhanced Analytics**
   - Team performance metrics
   - Market value estimation
   - Privacy-preserving benchmarking

## Conclusion

This architecture provides a robust, privacy-preserving, and gas-efficient system for managing confidential sports contracts. The combination of FHE, Gateway callbacks, timeout protection, and comprehensive security measures ensures both functionality and user protection while maintaining complete privacy of sensitive salary information.
