# Confidential Sports Contract Management

A privacy-preserving athlete salary management system built on Fully Homomorphic Encryption (FHE) technology, enabling secure and confidential contract negotiations in professional sports.

## 🌐 Live Demo

**Website**: [https://confidential-sports.vercel.app/](https://confidential-sports.vercel.app/)

## 🎬 Demo Video

**Demo Video**: The `demo.mp4` file demonstrates the complete sports contract management workflow with FHE encryption.

## Overview

This decentralized application revolutionizes sports contract management by ensuring complete privacy of athlete salaries and contract terms while maintaining transparency in the verification process. Using FHE technology, sensitive financial data remains encrypted throughout all operations, protecting both athletes and teams from unauthorized disclosure.

## Key Features

### Privacy-Preserving Architecture

- **Encrypted Salaries**: All athlete compensation encrypted on-chain using FHE
- **Gateway Callback Pattern**: Asynchronous decryption via trusted Gateway
- **Privacy Obfuscation**: Random multiplier protection against division attacks
- **Selective Decryption**: Role-based access to encrypted data

### Advanced Security

- **Input Validation**: Comprehensive bounds checking on all inputs
- **Access Control**: Role-based permissions (Owner, Team Manager, Athlete)
- **Overflow Protection**: Built-in Solidity 0.8.24 safety features
- **Audit Trail**: Complete event logging for all operations

### Timeout Protection & Refunds

- **Decryption Timeout**: 1-hour timeout for stuck Gateway requests
- **Proposal Expiry**: 30-day expiration for contract proposals
- **Emergency Withdrawal**: Recovery mechanism for expired proposals
- **Automatic Refunds**: Failed decryptions trigger auto-rejection

### Gas Optimization

- **HCU Efficiency**: Optimized homomorphic computation units
- **Batched Operations**: Reduced on-chain computation
- **Smart Permissions**: Efficient FHE permission management
- **State Caching**: Minimized redundant calculations

## Core Concepts

### Fully Homomorphic Encryption (FHE)

FHE allows computations to be performed directly on encrypted data without ever decrypting it. In the context of sports contracts, this means:

- **Salary Privacy**: Athlete salaries remain encrypted on-chain, visible only to authorized parties
- **Confidential Comparisons**: Salary cap compliance can be verified without revealing individual salaries
- **Secure Negotiations**: Contract proposals are processed while keeping financial terms private
- **Privacy-Preserving Analytics**: Teams can analyze payroll data without exposing sensitive information

### Gateway Callback Pattern

All decryption operations follow a secure asynchronous pattern:

```
User Request → Contract Records → Gateway Decrypts → Callback Completes Transaction
```

**Benefits:**
- Non-blocking operations
- Cryptographic proof verification
- Timeout protection for failed operations
- State consistency guarantees

### Privacy Protection Techniques

#### 1. Division Attack Protection
Random multiplier (1000x) applied to salaries to prevent ratio analysis:

```solidity
euint32 obfuscatedSalary = FHE.mul(encryptedSalary, PRIVACY_MULTIPLIER);
```

#### 2. Price Obfuscation
All financial data stored and processed in encrypted form, preventing statistical analysis.

#### 3. Encrypted Comparisons
Salary cap compliance checked without decryption:

```solidity
ebool isCompliant = FHE.le(totalPayroll, salaryCap);
```

## Smart Contract

**Network**: Ethereum-compatible with FHE support (Sepolia Testnet)

**Solidity Version**: ^0.8.24

**FHE Library**: @fhevm/solidity

The contract manages:
- Team registration with encrypted salary caps
- Athlete registration with privacy-protected salaries
- Contract proposals with Gateway callback pattern
- Timeout protection and refund mechanisms
- Privacy-preserving salary cap compliance

## Technology Stack

- **Development Framework**: Hardhat v2.19.4
- **Blockchain**: Ethereum-compatible network with FHE support
- **Smart Contracts**: Solidity v0.8.24 with FHE libraries
- **Testing**: Hardhat test suite with Chai assertions
- **Web3**: Ethers.js v6 for blockchain interaction
- **FHE Library**: fhevmjs for client-side encryption

## Getting Started

### Prerequisites

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH for deployment

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Configuration

Edit `.env` file:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Scripts

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to network
npm run deploy

# Verify contract
npm run verify

# Interact with contract
npm run interact

# Run simulation
npm run simulate
```

## Usage Examples

### Registering a Team (Owner Only)

```javascript
const teamId = await contract.registerTeam(
    "Champions United",
    "Premier League",
    managerAddress,
    ethers.parseEther("100000") // 100,000 ETH salary cap
);
```

### Registering an Athlete (Team Manager)

```javascript
// Encrypt salary data
const encryptedSalary = await fheInstance.encrypt32(ethers.parseEther("5000"));
const encryptedBonus = await fheInstance.encrypt32(ethers.parseEther("1000"));

const athleteId = await contract.registerAthlete(
    "Jane Doe",
    "Striker",
    teamId,
    athleteAddress,
    encryptedSalary,
    encryptedBonus,
    48  // 4-year contract
);
```

### Proposing a Contract (Gateway Callback Pattern)

```javascript
// 1. Team manager proposes contract
const proposalId = await contract.proposeContract(
    athleteId,
    teamId,
    encryptedNewSalary,
    encryptedNewBonus,
    36  // 3-year contract
);

// 2. Athlete requests decryption
const requestId = await contract.requestProposalDecryption(proposalId);

// 3. Wait for Gateway callback
contract.on('DecryptionCompleted', async (reqId, success) => {
    if (reqId === requestId && success) {
        // 4. Athlete approves after reviewing decrypted terms
        await contract.approveContract(proposalId);
    }
});

// 5. Handle timeout if Gateway fails
setTimeout(async () => {
    const status = await contract.getDecryptionStatus(requestId);
    if (!status.completed && !status.timedOut) {
        await contract.handleDecryptionTimeout(requestId);
        await contract.emergencyWithdrawProposal(proposalId);
    }
}, 3600000); // 1 hour timeout
```

### Checking Salary Cap Compliance

```javascript
// Returns encrypted boolean (ebool)
const isCompliant = await contract.checkSalaryCap(teamId);

// Team manager can decrypt result
const result = await fheInstance.decrypt(isCompliant, teamManagerAddress);
console.log(`Team is ${result ? 'compliant' : 'over'} salary cap`);
```

## Architecture

### Contract Structure

```
ConfidentialSportsContract
├── Team Management
│   ├── registerTeam()
│   └── deactivateTeam()
├── Athlete Management
│   ├── registerAthlete()
│   ├── updateAthleteSalary()
│   └── deactivateAthlete()
├── Contract Proposals (Gateway Pattern)
│   ├── proposeContract()
│   ├── requestProposalDecryption()
│   ├── proposalDecryptionCallback()
│   ├── approveContract()
│   └── rejectContract()
├── Timeout & Refund Protection
│   ├── handleDecryptionTimeout()
│   └── emergencyWithdrawProposal()
├── Privacy-Preserving Operations
│   ├── checkSalaryCap()
│   └── _updateTeamPayroll()
└── View Functions
    ├── getAthleteInfo()
    ├── getTeamInfo()
    ├── getProposalInfo()
    └── getDecryptionStatus()
```

### Security Features

1. **Input Validation**
   - Salary range: 0.001 ETH to 1,000,000 ETH
   - Contract duration: 1-120 months (max 10 years)
   - String length: 1-100 characters
   - Address validation: non-zero addresses

2. **Access Control**
   - Owner: System administration
   - Team Manager: Team and athlete management
   - Athlete: Contract approval/rejection

3. **Overflow Protection**
   - Solidity 0.8.24 built-in checks
   - Validated input ranges
   - Safe arithmetic operations

4. **FHE Permission Management**
   - Granular access control
   - Explicit permission grants
   - No unauthorized decryption

### Privacy Solutions

| Problem | Solution | Implementation |
|---------|----------|----------------|
| Division attacks | Random multiplier | `PRIVACY_MULTIPLIER = 1000` |
| Price leakage | Encryption + obfuscation | `euint32` storage |
| Async operations | Gateway callback pattern | `requestDecryption()` |
| Gas optimization | HCU-efficient operations | Batched FHE operations |

## Documentation

- **[Architecture Documentation](./ARCHITECTURE.md)**: Detailed system design and implementation
- **[API Documentation](./API.md)**: Complete function reference and examples
- **[Deployment Guide](./DEPLOYMENT.md)**: Step-by-step deployment instructions
- **[Contributing Guide](./CONTRIBUTING.md)**: How to contribute to the project

## Contract Constants

```solidity
uint256 public constant DECRYPTION_TIMEOUT = 1 hours;
uint256 public constant MAX_CONTRACT_DURATION = 10 * 365 days;
uint256 public constant MIN_SALARY = 0.001 ether;
uint256 public constant MAX_SALARY_CAP = 1000000 ether;
uint256 private constant PRIVACY_MULTIPLIER = 1000;
```

## Events

The contract emits comprehensive events for monitoring:

- `TeamRegistered`: New team added
- `AthleteRegistered`: New athlete added
- `ContractProposed`: Contract proposal created
- `DecryptionRequested`: Gateway decryption requested
- `DecryptionCompleted`: Gateway callback received
- `DecryptionTimedOut`: Request timed out
- `ContractApproved`: Proposal approved
- `ContractRejected`: Proposal rejected
- `EmergencyWithdrawal`: Expired proposal withdrawn
- `SalaryUpdated`: Athlete salary updated
- `PayrollUpdated`: Team payroll recalculated
- `SeasonStarted`: New season initiated

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/ConfidentialSportsContract.test.js

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npm run coverage
```

## Security Considerations

### Audit Recommendations

1. **Gateway Callback Security**
   - Verify signature validation in `proposalDecryptionCallback()`
   - Check replay attack prevention
   - Validate callback authorization

2. **Timeout Mechanism**
   - Test race conditions
   - Verify state consistency after timeout
   - Validate emergency withdrawal safety

3. **Access Control**
   - Audit permission enforcement
   - Review role assignment security
   - Validate FHE permission management

4. **Input Validation**
   - Check bounds enforcement
   - Test edge cases
   - Verify overflow protection

### Best Practices

- Always encrypt sensitive data before submission
- Monitor decryption request timeouts
- Implement emergency withdrawal fallbacks
- Validate event emissions before state changes
- Use role-based access control consistently

## Gas Optimization

### HCU (Homomorphic Computation Units) Tips

1. **Batch Operations**: Combine multiple FHE operations
2. **Minimize Decryptions**: Only decrypt when absolutely necessary
3. **Efficient Permissions**: Grant FHE permissions in batches
4. **Cache Results**: Store encrypted results to avoid recomputation

### Example: Optimized Payroll Calculation

```solidity
// Efficient: Single loop with batched operations
euint32 totalPayroll = FHE.asEuint32(0);
for (uint256 i = 0; i < athleteCount; i++) {
    euint32 athleteTotal = FHE.add(salary[i], bonus[i]);
    totalPayroll = FHE.add(totalPayroll, athleteTotal);
}
```

## Roadmap

### Future Enhancements

- [ ] Multi-signature contract approvals
- [ ] Performance-based bonus triggers
- [ ] Inter-team transfer market
- [ ] Privacy-preserving league analytics
- [ ] Automated compliance reporting
- [ ] Integration with identity systems
- [ ] Mobile app support

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

For questions, issues, or feature requests:

- Open an issue on GitHub
- Review the documentation
- Check existing issues for solutions

## Acknowledgments

- **Zama**: FHE library and tools
- **Hardhat**: Development framework
- **Ethereum**: Blockchain platform
- **OpenZeppelin**: Security patterns

## Disclaimer

This software is provided "as is" for educational and development purposes. It has not been audited for production use. Always conduct thorough security audits before deploying to mainnet with real funds.
