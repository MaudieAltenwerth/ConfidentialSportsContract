# Confidential Sports Contract Management

A privacy-preserving athlete salary management system built on Fully Homomorphic Encryption (FHE) technology, enabling secure and confidential contract negotiations in professional sports.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19.4-orange.svg)](https://hardhat.org/)

**Live Demo**: [https://confidential-sports.vercel.app/](https://confidential-sports.vercel.app/)

**GitHub Repository**: [https://github.com/MaudieAltenwerth/ConfidentialSportsContract](https://github.com/MaudieAltenwerth/ConfidentialSportsContract)

**Demo Video**: Download and watch `demo.mp4` to see the full system demonstration (video link is not clickable, please download the file to view)

## Overview

This decentralized application revolutionizes sports contract management by ensuring complete privacy of athlete salaries and contract terms while maintaining transparency in the verification process. Using FHE technology from Zama, sensitive financial data remains encrypted throughout all operations, protecting both athletes and teams from unauthorized disclosure.

### Key Innovation

The system leverages **Fully Homomorphic Encryption (FHE)** to perform computations on encrypted data without ever decrypting it, enabling unprecedented privacy in sports contract management while maintaining auditability and compliance verification.

## Core Concepts

### Fully Homomorphic Encryption (FHE)

FHE allows computations to be performed directly on encrypted data without ever decrypting it. In the context of sports contracts, this means:

- **Salary Privacy**: Athlete salaries remain encrypted on-chain, visible only to authorized parties
- **Confidential Comparisons**: Salary cap compliance can be verified without revealing individual salaries
- **Secure Negotiations**: Contract proposals are processed while keeping financial terms private
- **Privacy-Preserving Analytics**: Teams can analyze payroll data without exposing sensitive information

### Confidential Athlete Salaries - The Core Privacy Model

The system implements multiple layers of privacy protection for athlete compensation:

#### Encrypted Salary Storage
All athlete salaries and bonuses are stored using FHE encrypted types (`euint32`):
- **On-Chain Encryption**: Salary data never exists in plaintext on the blockchain
- **Permanent Privacy**: Even validators and node operators cannot see actual values
- **Selective Decryption**: Only authorized parties with proper permissions can decrypt
- **Immutable Records**: All encrypted data is tamper-proof and auditable

#### Access Control Hierarchy
- **Athletes**: Can view only their own encrypted salary and bonus information
- **Team Managers**: Can access encrypted data for athletes on their roster
- **Contract Owner**: Administrative access for system-wide operations
- **Public**: Can view non-sensitive information (names, positions, contract dates)

#### Privacy-Preserving Operations
The system performs computations on encrypted data:
- **Payroll Calculation**: Team total payroll computed without decrypting individual salaries
- **Salary Cap Verification**: Compliance checks using FHE comparison operations
- **Bonus Processing**: Encrypted bonus amounts added to base salaries
- **Contract Comparisons**: Evaluate multiple offers without revealing amounts

### Privacy Sports Contract Management System

This comprehensive contract management platform provides:

#### Team Management
- **Encrypted Salary Caps**: Each team has a confidential maximum payroll limit
- **Roster Privacy**: Team composition visible, but compensation remains private
- **League Organization**: Support for multiple leagues with different salary structures
- **Manager Controls**: Team managers can propose and manage contracts

#### Athlete Registration
- **Confidential Compensation**: Base salary and performance bonuses fully encrypted
- **Contract Duration**: Transparent start and end dates for contract terms
- **Position Information**: Public position data (Forward, Guard, etc.)
- **Multi-Team History**: Athletes can transfer between teams with encrypted salary updates

#### Contract Proposal System
- **Private Negotiations**: Teams propose new contracts with encrypted terms
- **Athlete Approval**: Players review and approve encrypted offers
- **Counteroffer Support**: Salary adjustments without public disclosure
- **Historical Records**: All proposals stored with timestamps and status

#### Automated Compliance Verification
- **Salary Cap Enforcement**: Real-time verification without revealing individual salaries
- **Encrypted Comparisons**: FHE-based `le()` (less than or equal) operations
- **Automatic Alerts**: Smart contract events for compliance violations
- **Payroll Updates**: Dynamic recalculation as roster changes occur

## Smart Contract Architecture

### Deployed Contract

**Contract Address**: `0x0A42624B5d5e1400556a3487f2171423c57519e0`

**Network**: Sepolia Testnet (Chain ID: 11155111)

**Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x0A42624B5d5e1400556a3487f2171423c57519e0)

**Compiler**: Solidity v0.8.24 with FHE optimizations

### Contract Structure

#### Core Data Structures

```solidity
struct Athlete {
    string name;
    string position;
    uint256 teamId;
    euint32 encryptedSalary;      // FHE encrypted salary
    euint32 encryptedBonus;       // FHE encrypted bonus
    bool isActive;
    uint256 contractStart;
    uint256 contractEnd;
    address athleteAddress;
}

struct Team {
    string teamName;
    string league;
    address teamManager;
    euint32 encryptedTotalPayroll;  // FHE encrypted total
    euint32 encryptedSalaryCap;     // FHE encrypted cap
    uint256[] athleteIds;
    bool isActive;
}

struct ContractProposal {
    uint256 athleteId;
    uint256 teamId;
    euint32 proposedSalary;         // FHE encrypted offer
    euint32 proposedBonus;          // FHE encrypted bonus
    uint256 contractDuration;
    bool isPending;
    bool isApproved;
    address proposer;
    uint256 timestamp;
}
```

#### Key Functions

**Team Operations:**
- `registerTeam()`: Create new team with encrypted salary cap
- `getTeamInfo()`: Retrieve public team information
- `deactivateTeam()`: Remove team from active roster

**Athlete Operations:**
- `registerAthlete()`: Add athlete with encrypted compensation
- `updateAthleteSalary()`: Modify encrypted salary and bonus
- `getAthleteInfo()`: Fetch public athlete details
- `deactivateAthlete()`: Mark athlete as inactive

**Contract Management:**
- `proposeContract()`: Submit encrypted contract offer
- `approveContract()`: Athlete accepts proposal
- `getProposalInfo()`: View proposal status

**Privacy Operations:**
- `checkSalaryCap()`: Verify compliance using FHE comparison
- `_updateTeamPayroll()`: Recalculate encrypted team total
- `getMyAthletes()`: List athlete IDs for address
- `getMyTeams()`: List team IDs for manager

#### Security Features

**Access Modifiers:**
- `onlyOwner`: Contract owner administrative functions
- `onlyTeamManager(teamId)`: Team-specific management
- `onlyAthlete(athleteId)`: Athlete self-management
- `validTeam(teamId)`: Team existence validation
- `validAthlete(athleteId)`: Athlete existence validation

**FHE Permission Management:**
```solidity
FHE.allowThis(encryptedValue);        // Contract can access
FHE.allow(encryptedValue, address);   // Grant address permission
```

**Events for Transparency:**
- `AthleteRegistered`: New athlete added
- `TeamRegistered`: New team created
- `SalaryUpdated`: Compensation modified
- `ContractProposed`: New offer submitted
- `ContractApproved`: Offer accepted
- `PayrollUpdated`: Team totals recalculated
- `SeasonStarted`: New season initiated

## Technology Stack

### Frontend Technologies (React Application)
- **UI Framework**: React v18.2.0 - Modern component-based architecture
- **Build Tool**: Vite v5.0.11 - Fast development and optimized builds
- **Language**: JavaScript (JSX) - Dynamic web application development
- **Styling**: CSS3 with responsive design and gradient animations
- **Component Architecture**: Functional components with React Hooks
- **State Management**: React useState and useEffect hooks
- **Form Handling**: Native FormData API with controlled inputs

### Blockchain & Smart Contracts
- **Development Framework**: Hardhat v2.19.4 - Ethereum development environment
- **Smart Contract Language**: Solidity v0.8.24 with FHE extensions
- **FHE Library**: Zama fhevmjs v0.5.0 for encrypted computations
- **SDK Integration**: @fhevm-sdk/core - Framework-agnostic FHEVM SDK
- **Network**: Sepolia Testnet with FHE coprocessor support
- **Contract Standard**: EIP-712 for typed data signing

### Web3 & Frontend Integration
- **Blockchain Interaction**: Ethers.js v6.10.0 (BrowserProvider, Contract)
- **Wallet Integration**: MetaMask with automatic reconnection
- **SDK Hooks**: useFhevmClient, useFhevmInit, useEncryptedInput
- **Provider Pattern**: FhevmProvider for global state management
- **RPC Provider**: Infura/Alchemy for reliable node access
- **Network Detection**: Automatic chain ID verification and switching
- **Transaction Management**: Real-time status updates and confirmations

### FHE (Fully Homomorphic Encryption) Integration
- **Encryption Library**: fhevmjs for client-side encryption
- **SDK Architecture**: Framework-agnostic core with React bindings
- **Encrypted Types**: Support for euint8, euint16, euint32, euint64, ebool
- **Key Management**: Automatic FHE key initialization and caching
- **Input Encryption**: createEncryptedInput() for batch encryption
- **Permission System**: FHE.allow() and FHE.allowThis() access control
- **Decryption**: EIP-712 signed decryption requests for privacy

### Testing & Quality Assurance
- **Test Framework**: Hardhat with Mocha and Chai
- **Coverage**: 45+ comprehensive test cases
- **Code Quality**: ESLint, Prettier, Solhint
- **CI/CD**: GitHub Actions for automated testing
- **Test Networks**: Local Hardhat network, Sepolia testnet
- **Browser Testing**: Manual testing with MetaMask integration

### Deployment & Verification
- **Frontend Hosting**: Vercel with automatic deployments
- **Contract Deployment**: Automated deploy.js with validation
- **Contract Verification**: Etherscan API integration
- **Interaction Tools**: Interactive scripts for contract operations
- **Simulation**: End-to-end workflow testing
- **Live Demo**: Production deployment at confidential-sports.vercel.app

### Development Tools & DevOps
- **Package Manager**: npm with workspace support
- **Module Bundler**: Vite with Hot Module Replacement (HMR)
- **Version Control**: Git with comprehensive .gitignore
- **Environment Management**: dotenv for configuration
- **Documentation**: Comprehensive Markdown documentation
- **Browser DevTools**: React DevTools, MetaMask debugging
- **Build Optimization**: Vite production build with tree-shaking

### Additional Libraries & Dependencies
- **React DOM**: v18.2.0 for rendering
- **Vite Plugin React**: v4.2.1 for JSX transformation
- **Polyfills**: process, buffer, crypto-browserify for Web3 compatibility
- **Type Definitions**: TypeScript definitions for better IDE support

## Getting Started

### Prerequisites

**Required Software:**
- Node.js v18.0.0 or higher ([Download](https://nodejs.org/))
- npm v9.0.0 or higher (included with Node.js)
- Git for version control

**Blockchain Requirements:**
- MetaMask browser extension ([Install](https://metamask.io/))
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))
- Infura or Alchemy API key ([Sign up](https://infura.io/))

**Recommended:**
- Visual Studio Code with Solidity extension
- Basic understanding of Ethereum and smart contracts
- Familiarity with FHE concepts

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/MaudieAltenwerth/ConfidentialSportsContract.git
cd ConfidentialSportsContract
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings:
# - INFURA_API_KEY or ALCHEMY_API_KEY
# - PRIVATE_KEY (for deployment)
# - ETHERSCAN_API_KEY (for verification)
```

4. **Compile Contracts**
```bash
npm run compile
```

### Available Scripts

**Development:**
```bash
npm run compile          # Compile smart contracts
npm run test            # Run comprehensive test suite
npm run coverage        # Generate code coverage report
npm run lint            # Check code quality
npm run format          # Format code with Prettier
```

**Deployment:**
```bash
npm run deploy          # Deploy to configured network
npm run deploy:sepolia  # Deploy specifically to Sepolia
npm run verify          # Verify contract on Etherscan
```

**Interaction:**
```bash
npm run interact        # Interactive contract operations
npm run simulate        # Simulate complete workflow
```

**Utilities:**
```bash
npm run clean           # Clean build artifacts
npm run size            # Check contract sizes
npm run accounts        # List available accounts
```

### Quick Start Guide

1. **Set Up MetaMask**
   - Install MetaMask extension
   - Switch to Sepolia Testnet
   - Get test ETH from faucet

2. **Configure Project**
   - Add your Infura/Alchemy key to `.env`
   - Add deployment wallet private key
   - Add Etherscan API key for verification

3. **Deploy Contract**
   ```bash
   npm run deploy
   ```

4. **Verify on Etherscan**
   ```bash
   npm run verify
   ```

5. **Interact with Contract**
   ```bash
   npm run interact
   ```

6. **Try Live Demo**
   - Visit: [https://confidential-sports.vercel.app/](https://confidential-sports.vercel.app/)
   - Connect your MetaMask wallet
   - Register teams and athletes
   - Test encrypted operations

### Project Structure

```
ConfidentialSportsContract/
├── contracts/
│   └── ConfidentialSportsContract.sol  # Main FHE contract
├── scripts/
│   ├── deploy.js                       # Deployment automation
│   ├── verify.js                       # Etherscan verification
│   ├── interact.js                     # Contract interaction
│   └── simulate.js                     # Workflow simulation
├── test/
│   └── ConfidentialSportsContract.test.js  # 45+ test cases
├── .github/
│   └── workflows/                      # CI/CD pipelines
├── hardhat.config.cjs                  # Hardhat configuration
├── package.json                        # Dependencies and scripts
├── README.md                           # This file
├── DEPLOYMENT.md                       # Deployment guide
└── CONTRIBUTING.md                     # Contribution guidelines
```

## Use Cases

### Professional Sports Leagues
- **NBA/NFL/MLB**: Manage player contracts with salary privacy
- **International Teams**: Cross-border contract negotiations
- **Minor Leagues**: Confidential compensation for developing players

### Real-World Benefits
- **Athlete Privacy**: Protect personal financial information
- **Fair Negotiations**: Prevent salary information leaks during negotiations
- **Compliance**: Verify salary cap compliance without exposing data
- **Team Strategy**: Maintain competitive advantage with private payroll

### Business Applications
- **Executive Compensation**: Private salary management for C-suite
- **Talent Agencies**: Confidential client contract management
- **HR Systems**: Privacy-preserving employee compensation
- **Financial Services**: Encrypted compensation planning

## Security Considerations

### Smart Contract Security
- **Access Control**: Role-based permissions with multiple modifiers
- **Input Validation**: Comprehensive checks on all external calls
- **Reentrancy Protection**: No external calls before state changes
- **Integer Overflow**: Solidity 0.8.24 built-in protection
- **FHE Permissions**: Explicit permission grants for encrypted data

### Privacy Guarantees
- **End-to-End Encryption**: Data encrypted before submission
- **On-Chain Privacy**: Blockchain storage never reveals plaintext
- **Selective Decryption**: Only authorized parties can decrypt
- **No Backdoors**: Cryptographically impossible to break encryption

### Audit & Testing
- **45+ Test Cases**: Comprehensive functionality coverage
- **Edge Case Testing**: Boundary conditions and error scenarios
- **Integration Tests**: Full workflow simulations
- **Access Control Tests**: Permission and authorization verification
- **Gas Optimization**: Efficient operations to minimize costs

## Demo Video

The `demo.mp4` file contains a comprehensive demonstration of:
- System architecture and FHE concepts
- Smart contract deployment and verification
- Team registration with encrypted salary caps
- Athlete onboarding with confidential compensation
- Contract proposal and approval workflow
- Salary cap compliance verification
- Live web application demonstration

**Note**: The video file must be downloaded to view. Direct streaming links are not available.

## Live Application

**URL**: [https://confidential-sports.vercel.app/](https://confidential-sports.vercel.app/)

**Features Available:**
- Connect MetaMask wallet
- View contract statistics
- Register new teams (admin only)
- Register athletes with encrypted salaries
- Submit contract proposals
- Approve pending contracts
- Check salary cap compliance
- View public athlete and team information

**Requirements:**
- MetaMask installed and connected
- Sepolia testnet selected
- Sufficient test ETH for transactions

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Submitting pull requests
- Reporting issues
- Code style guidelines

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run test suite: `npm test`
6. Submit pull request

## Documentation

- **[Deployment Guide](DEPLOYMENT.md)**: Complete deployment instructions
- **[Contributing Guide](CONTRIBUTING.md)**: How to contribute to the project
- **[CI/CD Documentation](CI_CD.md)**: GitHub Actions workflows
- **Demo Video**: `demo.mp4` - System demonstration

## Resources

### Learn More About FHE
- [Zama Documentation](https://docs.zama.ai/)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [fhevmjs Library](https://github.com/zama-ai/fhevmjs)

### Ethereum Development
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [Solidity Documentation](https://docs.soliditylang.org/)

### Network Information
- [Sepolia Testnet](https://sepolia.dev/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Sepolia Explorer](https://sepolia.etherscan.io/)

## Support

For questions, issues, or discussions:
- **GitHub Issues**: Report bugs or request features
- **GitHub Repository**: [https://github.com/MaudieAltenwerth/ConfidentialSportsContract](https://github.com/MaudieAltenwerth/ConfidentialSportsContract)
- **Live Demo**: [https://confidential-sports.vercel.app/](https://confidential-sports.vercel.app/)

## License

MIT License - see [LICENSE](LICENSE) file for details

Copyright (c) 2025 Confidential Sports Contract Contributors

## Acknowledgments

- **Zama**: For pioneering FHE technology and fhevmjs library
- **Ethereum Foundation**: For blockchain infrastructure
- **Hardhat Team**: For excellent development tools
- **Open Source Community**: For continuous improvements and feedback

---

**Built with Fully Homomorphic Encryption by Zama** 🔐

Protecting athlete privacy while maintaining transparency in sports contract management.
