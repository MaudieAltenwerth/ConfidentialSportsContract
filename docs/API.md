# Enhanced Belief Market API Documentation

## Overview

The Enhanced Belief Market API provides comprehensive access to privacy-preserving prediction market functionality with advanced security features, refund mechanisms, and Gateway callback processing.

## Core Contract APIs

### EnhancedBeliefMarket Contract

#### Market Management

##### `createBet`
Creates a new prediction market with enhanced security features.

```solidity
function createBet(
    string memory betId,
    uint256 voteStake,
    uint256 duration
) external payable
```

**Parameters:**
- `betId` (string): Unique identifier for the market (max 100 chars, alphanumeric + hyphen/underscore)
- `voteStake` (uint256): Minimum stake required per vote (min: 0.005 ETH, max: 10 ETH)
- `duration` (uint256): Market duration in seconds (min: 5 minutes, max: 30 days)

**Requirements:**
- `msg.value` must equal `platformStake` (default: 0.02 ETH)
- Contract must not be in emergency mode
- Gateway contract must be configured
- Valid bet ID format

**Events:**
```solidity
event BetCreated(string betId, address creator, uint256 stakeAmount, uint256 voteStake, uint256 expiryTime);
```

##### `vote`
Casts an encrypted vote in a prediction market.

```solidity
function vote(
    string memory betId,
    externalEuint64 encryptedWeight,
    uint8 voteType,
    bytes calldata inputProof
) external payable
```

**Parameters:**
- `betId` (string): Identifier of the target market
- `encryptedWeight` (externalEuint64): FHE-encrypted vote weight
- `voteType` (uint8): Vote type (0 = No, 1 = Yes)
- `inputProof` (bytes): FHE input proof for validation

**Requirements:**
- `msg.value` must equal market's `voteStake`
- Market must exist and not be resolved
- Market must not have expired
- User must not have already voted
- Valid vote type and encryption proof

**Events:**
```solidity
event VoteCast(string betId, address voter, uint256 amount);
```

#### Market Resolution

##### `requestTallyReveal`
Requests decryption of vote tallies after market expiry.

```solidity
function requestTallyReveal(string memory betId) external
```

**Parameters:**
- `betId` (string): Identifier of the market to resolve

**Requirements:**
- Market must exist and not be resolved
- Market must have expired
- Caller must be market creator
- Decryption timeout must not have passed

**Events:**
```solidity
event TallyRevealRequested(string betId, uint256 requestId, uint256 timeoutDeadline);
```

##### `claimPrize`
Claims prize for winning voters.

```solidity
function claimPrize(string memory betId) external
```

**Parameters:**
- `betId` (string): Identifier of the market

**Requirements:**
- Market must be resolved
- No tie result
- User must have voted
- User must be a winner
- Must not have already claimed

**Events:**
```solidity
event PrizeDistributed(string betId, address winner, uint256 amount);
```

##### `claimRefund`
Claims refund for tie results or failed decryptions.

```solidity
function claimRefund(string memory betId) external
```

**Parameters:**
- `betId` (string): Identifier of the market

**Requirements:**
- Market must exist
- User must have voted
- Must not have already claimed
- One of the following must be true:
  - Market resolved with tie result
  - Decryption failed
  - Timeout occurred
  - Refund mechanism enabled

**Events:**
```solidity
event RefundProcessed(string betId, address user, uint256 amount, string reason);
```

#### Timeout and Failure Handling

##### `processTimeoutRefund`
Processes timeout-based refunds for stuck markets.

```solidity
function processTimeoutRefund(string memory betId) external
```

**Parameters:**
- `betId` (string): Identifier of the market

**Timeout Conditions:**
- Decryption timeout (1 hour after request)
- Gateway callback timeout (7 days after expiry)
- Decryption failure

**Events:**
```solidity
event TimeoutRefundTriggered(string betId, uint256 timeoutType);
```

#### Query Functions

##### `getBet`
Retrieves comprehensive market information.

```solidity
function getBet(string memory betId) external view returns (
    address creator,
    uint256 platformStake,
    uint256 voteStake,
    uint256 expiryTime,
    uint256 timeoutDeadline,
    bool isResolved,
    bool decryptionFailed,
    bool refundEnabled,
    uint64 yesVotes,
    uint64 noVotes,
    uint256 prizePool,
    bool yesWon
)
```

##### `getSystemStatus`
Retrieves system operational status.

```solidity
function getSystemStatus() external view returns (
    uint256 _totalBetsCreated,
    uint256 _totalDecryptionRequests,
    uint256 _totalRefundsProcessed,
    uint256 _lastSecurityUpdate,
    bool _emergencyMode,
    address _gatewayContract,
    uint256 _gatewayRequestCounter
)
```

##### `canClaimRefund`
Checks if a user can claim refund and the reason.

```solidity
function canClaimRefund(string memory betId, address user) external view returns (
    bool allowed,
    string memory reason
)
```

#### Admin Functions

##### `setGatewayContract`
Sets the authorized Gateway contract address.

```solidity
function setGatewayContract(address _gateway) external onlyOwner
```

##### `activateEmergencyMode`
Activates emergency pause mode.

```solidity
function activateEmergencyMode(string calldata reason) external onlyOwner
```

##### `deactivateEmergencyMode`
Deactivates emergency pause mode.

```solidity
function deactivateEmergencyMode() external onlyOwner
```

### GatewayProcessor Contract

#### Core Processing Functions

##### `processDecryptionRequest`
Processes FHE decryption requests with validation.

```solidity
function processDecryptionRequest(
    address targetContract,
    uint256 requestId,
    bytes calldata cleartexts,
    bytes calldata decryptionProof,
    uint256 requestTimestamp
) external onlyAuthorized
```

**Parameters:**
- `targetContract` (address): Contract requesting decryption
- `requestId` (uint256): Unique request identifier
- `cleartexts` (bytes): Decrypted data from FHE oracle
- `decryptionProof` (bytes): Proof of correct decryption
- `requestTimestamp` (uint256): Original request timestamp

**Requirements:**
- Caller must be authorized
- Request must not have been processed
- Request must be within timeout period

**Events:**
```solidity
event RequestProcessed(uint256 requestId, address targetContract, bool success);
event DecryptionCompleted(uint256 requestId, bytes32 resultHash);
```

##### `batchProcessDecryptionRequests`
Processes multiple decryption requests efficiently.

```solidity
function batchProcessDecryptionRequests(
    address[] calldata targetContracts,
    uint256[] calldata requestIds,
    bytes[] calldata cleartexts,
    bytes[] calldata decryptionProofs,
    uint256[] calldata timestamps
) external onlyAuthorized
```

##### `processEmergencyRefund`
Processes emergency refunds for failed markets.

```solidity
function processEmergencyRefund(
    address targetContract,
    string calldata betId,
    address[] calldata users
) external onlyAuthorized
```

#### Admin Functions

##### `authorizeContract`
Authorizes a contract to use Gateway services.

```solidity
function authorizeContract(address contractAddress) external onlyOwner
```

##### `deauthorizeContract`
Revokes authorization for a contract.

```solidity
function deauthorizeContract(address contractAddress) external onlyOwner
```

#### Query Functions

##### `isRequestProcessed`
Checks if a request has been processed.

```solidity
function isRequestProcessed(address targetContract, uint256 requestId) external view returns (bool)
```

##### `getSystemStatus`
Retrieves Gateway system status.

```solidity
function getSystemStatus() external view returns (
    uint256 _requestCounter,
    address _owner,
    uint256 totalAuthorized
)
```

## SecurityLib Functions

### Validation Functions

#### `validateBetId`
Validates bet ID format and characters.

```solidity
function validateBetId(string memory betId) internal pure returns (bool valid, string memory reason)
```

#### `validateVoteType`
Validates vote type (0 or 1).

```solidity
function validateVoteType(uint8 voteType) internal pure returns (bool valid, string memory reason)
```

#### `validateDuration`
Validates duration within bounds.

```solidity
function validateDuration(uint256 duration, uint256 minDuration, uint256 maxDuration) internal pure returns (bool valid, string memory reason)
```

### Safe Arithmetic

#### `safeAdd`
Safe addition with overflow protection.

```solidity
function safeAdd(uint256 a, uint256 b) internal pure returns (uint256 result, bool success)
```

#### `safeSub`
Safe subtraction with underflow protection.

```solidity
function safeSub(uint256 a, uint256 b) internal pure returns (uint256 result, bool success)
```

#### `safeMul`
Safe multiplication with overflow protection.

```solidity
function safeMul(uint256 a, uint256 b) internal pure returns (uint256 result, bool success)
```

#### `safeDiv`
Safe division with zero protection.

```solidity
function safeDiv(uint256 a, uint256 b) internal pure returns (uint256 result, bool success)
```

### Privacy Protection

#### `generatePrivacyDelay`
Generates randomized delay for privacy.

```solidity
function generatePrivacyDelay(uint256 baseDelay, uint256 randomSeed) internal view returns (uint256 delay)
```

#### `fuzzyPriceCompare`
Compares prices with tolerance to prevent exact analysis.

```solidity
function fuzzyPriceCompare(uint256 price1, uint256 price2, uint256 toleranceBps) internal pure returns (bool equal)
```

#### `obfuscateValue`
Adds noise to values for privacy protection.

```solidity
function obfuscateValue(uint256 value, uint256 randomSeed) internal view returns (uint256 obfuscated)
```

## Event Types

### Market Events
```solidity
event BetCreated(string betId, address creator, uint256 stakeAmount, uint256 voteStake, uint256 expiryTime);
event VoteCast(string betId, address voter, uint256 amount);
event BetResolved(string betId, bool yesWon, uint64 revealedYes, uint64 revealedNo, uint256 totalPrize);
event PrizeDistributed(string betId, address winner, uint256 amount);
event RefundProcessed(string betId, address user, uint256 amount, string reason);
```

### System Events
```solidity
event TallyRevealRequested(string betId, uint256 requestId, uint256 timeoutDeadline);
event GatewayCallbackReceived(uint256 requestId, string betId, uint8 requestType);
event TimeoutRefundTriggered(string betId, uint256 timeoutType);
event DecryptionFailed(string betId, uint256 requestId, string reason);
event EmergencyModeActivated(string reason);
event EmergencyModeDeactivated();
event PlatformFeesWithdrawn(address indexed to, uint256 amount);
```

### Gateway Events
```solidity
event RequestProcessed(uint256 requestId, address targetContract, bool success);
event DecryptionCompleted(uint256 requestId, bytes32 resultHash);
event ErrorOccurred(uint256 requestId, string reason);
event ContractAuthorized(address contractAddress);
event ContractDeauthorized(address contractAddress);
```

## Error Codes and Messages

### Common Errors
- `"Not owner"`: Caller is not contract owner
- `"Not authorized gateway"`: Caller is not authorized gateway
- `"Emergency mode active"`: Contract is in emergency mode
- `"Invalid bet ID"`: Bet ID format is invalid
- `"Bet doesn't exist"`: Market with given ID doesn't exist
- `"Already voted"`: User has already voted in this market
- `"Insufficient prize pool"`: Not enough funds for operation

### Validation Errors
- `"Value out of bounds"`: Parameter outside allowed range
- `"Invalid vote type"`: Vote type must be 0 or 1
- `"Stake amount too low"`: Stake below minimum required
- `"Stake amount too high"`: Stake above maximum allowed

### Timeout Errors
- `"Request timeout"`: Request exceeded processing time limit
- `"Decryption timeout passed"`: Decryption request timed out
- `"Callback timeout"`: Gateway callback timed out

## Constants and Limits

### Time Constants
```solidity
uint256 constant MIN_DURATION = 5 minutes;
uint256 constant MAX_DURATION = 30 days;
uint256 constant DECRYPTION_TIMEOUT = 1 hours;
uint256 constant REFUND_TIMEOUT = 30 days;
uint256 constant EMERGENCY_TIMEOUT = 7 days;
```

### Financial Constants
```solidity
uint256 constant MIN_VOTE_STAKE = 0.005 ether;
uint256 platformStake = 0.02 ether; // Configurable
```

### Gateway Constants
```solidity
uint256 constant PROCESSING_TIMEOUT = 1 hours;
```

## Usage Examples

### Creating a Market
```solidity
// Create a 24-hour market with 0.01 ETH voting stake
marketContract.createBet{
    value: 0.02 ether
}("market-001", 0.01 ether, 24 hours);
```

### Casting a Vote
```solidity
// Generate encrypted vote (client-side)
(bytes memory encryptedData, bytes memory proof) = fheClient.encryptVote(voteType, weight);

// Cast the vote
marketContract.vote{
    value: 0.01 ether
}("market-001", encryptedData, voteType, proof);
```

### Requesting Market Resolution
```solidity
// After market expiry, request decryption
marketContract.requestTallyReveal("market-001");
```

### Gateway Processing
```solidity
// Gateway processes decryption callback
gatewayContract.processDecryptionRequest(
    address(marketContract),
    requestId,
    decryptedData,
    proof,
    requestTimestamp
);
```

### Claiming Winnings
```solidity
// Check if can claim
(bool canClaim,) = marketContract.canClaimRefund("market-001", userAddress);

if (canClaim) {
    marketContract.claimRefund("market-001");
}
```

This API provides comprehensive access to all Enhanced Belief Market functionality with robust error handling and security features.