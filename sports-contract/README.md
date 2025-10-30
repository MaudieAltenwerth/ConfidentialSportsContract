# Confidential Sports Contract Management

A privacy-preserving athlete salary management system built on Fully Homomorphic Encryption (FHE) technology, enabling secure and confidential contract negotiations in professional sports.

## Overview

This decentralized application revolutionizes sports contract management by ensuring complete privacy of athlete salaries and contract terms while maintaining transparency in the verification process. Using FHE technology, sensitive financial data remains encrypted throughout all operations, protecting both athletes and teams from unauthorized disclosure.

## Core Concepts

### Fully Homomorphic Encryption (FHE)

FHE allows computations to be performed directly on encrypted data without ever decrypting it. In the context of sports contracts, this means:

- **Salary Privacy**: Athlete salaries remain encrypted on-chain, visible only to authorized parties
- **Confidential Comparisons**: Salary cap compliance can be verified without revealing individual salaries
- **Secure Negotiations**: Contract proposals are processed while keeping financial terms private
- **Privacy-Preserving Analytics**: Teams can analyze payroll data without exposing sensitive information

### Confidential Athlete Salaries

The system implements multiple layers of privacy protection:

- **Encrypted Storage**: All salary data is stored as encrypted values on the blockchain
- **Role-Based Access**: Only team managers and athletes can decrypt their own contract details
- **Anonymous Benchmarking**: Teams can compare offers without revealing exact figures
- **Audit Trail**: All operations are logged while maintaining data confidentiality

### Privacy Sports Contract Management

Key features include:

- **Team Registration**: Sports organizations can register with encrypted salary cap information
- **Athlete Onboarding**: Players are registered with confidential salary and bonus structures
- **Contract Proposals**: Teams can submit offers with encrypted compensation terms
- **Automated Compliance**: Smart contracts verify salary cap compliance without exposing individual salaries
- **Secure Approval**: Multi-party contract approval while preserving privacy

## Smart Contract

**Contract Address**: `0x0A42624B5d5e1400556a3487f2171423c57519e0`

The FHE-enabled smart contract manages all confidential operations, including:

- Team and athlete registration with encrypted financial data
- Confidential contract proposals and negotiations
- Privacy-preserving salary cap verification
- Secure access control for sensitive information
- Encrypted event emissions for tracking

## Features

### React Frontend Application
- **Modern UI**: Responsive React application with gradient design
- **SDK Integration**: Built with @fhevm-sdk/core for seamless FHE operations
- **Real-time Updates**: Live contract statistics and transaction status
- **Wallet Connection**: MetaMask integration with automatic reconnection
- **Encrypted Operations**: Client-side encryption before blockchain submission
- **Form Validation**: Comprehensive input validation and error handling
- **Status Messages**: Real-time feedback for all user actions
- **Mobile Responsive**: Optimized for desktop and mobile devices

### For Teams
- Register teams with confidential salary cap limits
- Submit encrypted contract offers to athletes
- Verify salary cap compliance without exposing individual salaries
- Manage athlete rosters with privacy guarantees
- View team statistics and payroll information (encrypted)

### For Athletes
- Register with encrypted salary expectations
- Receive and evaluate confidential contract offers
- Maintain privacy of compensation details
- Track contract history securely
- Approve/reject contract proposals

### For Leagues
- Monitor overall contract activity
- Ensure salary cap compliance across teams
- Generate privacy-preserving statistics
- Maintain competitive balance
- Audit trail with encrypted data

## Demo

🎥 **Video Demonstration**: [Watch Demo](ConfidentialSportsContract.mp4)

🌐 **Live Application**: [https://confidential-sports.vercel.app/](https://confidential-sports.vercel.app/)

📦 **GitHub Repository**: [https://github.com/MaudieAltenwerth/ConfidentialSportsContract](https://github.com/MaudieAltenwerth/ConfidentialSportsContract)

## Technology Stack

### Frontend
- **UI Framework**: React v18.2.0 with Hooks
- **Build Tool**: Vite v5.0.11
- **Language**: JavaScript (JSX)
- **Styling**: CSS3 with responsive design
- **SDK**: @fhevm-sdk/core for FHE operations

### Blockchain & Encryption
- **Blockchain**: Ethereum-compatible network with FHE support
- **Encryption**: Fully Homomorphic Encryption (Zama fhevmjs v0.5.0)
- **Smart Contracts**: Solidity v0.8.24 with FHE libraries
- **Development**: Hardhat v2.19.4
- **Web3**: Ethers.js v6.10.0
- **Wallet**: MetaMask integration with automatic reconnection

### Key Features
- **React Integration**: FhevmProvider, useFhevmClient, useFhevmInit hooks
- **Encrypted Operations**: Client-side encryption before blockchain submission
- **Real-time Updates**: Live transaction status and confirmations
- **Responsive Design**: Mobile-friendly interface

## Use Cases

### Professional Sports Leagues
- **NBA/NFL/MLB**: Manage salary caps while protecting player compensation privacy
- **European Football**: Handle confidential transfer fees and wages
- **International Sports**: Coordinate multi-currency contracts with privacy

### Agent Negotiations
- Compare multiple offers without revealing specific terms
- Benchmark against market rates confidentially
- Protect client financial privacy

### Financial Compliance
- Verify salary cap compliance without data exposure
- Audit contract terms while maintaining confidentiality
- Generate encrypted reports for regulatory bodies

## Privacy Guarantees

The system provides the following privacy assurances:

1. **Data Confidentiality**: Salaries and bonuses are never exposed in plaintext on-chain
2. **Computation Privacy**: All financial calculations occur on encrypted data
3. **Access Control**: Only authorized parties can decrypt sensitive information
4. **Verifiable Results**: Contract compliance can be proven without revealing details
5. **No Trusted Third Party**: Privacy is cryptographically guaranteed, not policy-based

## Getting Started

### Prerequisites
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- MetaMask browser extension
- Sepolia testnet ETH

### Installation

1. **Install Dependencies**
```bash
cd sports-contract
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

The application will start at `http://localhost:5173`

3. **Build for Production**
```bash
npm run build
```

4. **Preview Production Build**
```bash
npm run preview
```

### Smart Contract Development

**Compile Contracts:**
```bash
npm run compile
```

**Run Tests:**
```bash
npm run test
```

**Deploy to Sepolia:**
```bash
npm run deploy:sepolia
```

**Verify on Etherscan:**
```bash
npm run verify
```

### Usage

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Ensure you're on Sepolia testnet

2. **Wait for FHEVM Initialization**
   - The SDK will automatically initialize FHE encryption
   - This may take a few seconds on first connection

3. **Register a Team**
   - Enter team details
   - Set encrypted salary cap
   - Confirm transaction in MetaMask

4. **Register Athletes**
   - Enter athlete information
   - Set encrypted salary and bonus
   - Link to team ID

5. **Propose Contracts**
   - Submit encrypted contract offers
   - Athletes can review and approve

6. **Query Information**
   - View public team and athlete data
   - Check salary cap compliance
   - Review contract proposals

## Project Structure

```
sports-contract/
├── src/                          # React application source
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Main app with SDK integration
│   └── index.css                 # Styles
├── contracts/                    # Smart contracts
│   └── ConfidentialSportsContract.sol
├── scripts/                      # Deployment scripts
│   ├── deploy.js
│   └── verify.js
├── test/                         # Contract tests
├── public/                       # Static assets (legacy HTML for reference)
│   ├── index.html
│   └── app.js
├── index.html                    # Vite HTML template
├── vite.config.js                # Vite configuration
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## Architecture

```
┌──────────────────────────────┐
│      React Application       │
│   - Vite Build System        │
│   - Component Architecture   │
│   - React Hooks (State)      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      @fhevm-sdk/core         │
│   - FhevmProvider            │
│   - useFhevmClient Hook      │
│   - useFhevmInit Hook        │
│   - useEncryptedInput Hook   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       fhevmjs Library        │
│   - Client-side Encryption   │
│   - FHE Key Management       │
│   - createEncryptedInput()   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         Ethers.js v6         │
│   - BrowserProvider          │
│   - Contract Interface       │
│   - Transaction Management   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         MetaMask             │
│   - Wallet Connection        │
│   - Transaction Signing      │
│   - Network Switching        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     FHE Smart Contract       │
│   (Sepolia Testnet)          │
│   - Encrypted Storage        │
│   - FHE Computations         │
│   - Access Control           │
│   - Event Emissions          │
└──────────────────────────────┘
```

## Security Considerations

- All sensitive data is encrypted using FHE before submission
- Private keys never leave the user's wallet
- Contract access is controlled via on-chain permissions
- Encrypted data cannot be decrypted by unauthorized parties
- All transactions are cryptographically signed and verified

## Future Enhancements

- Multi-signature approval for high-value contracts
- Encrypted escrow for signing bonuses
- Privacy-preserving dispute resolution
- Cross-chain confidential transfers
- Encrypted performance metrics tracking
- Anonymous salary benchmarking marketplace

## Support

For questions, issues, or contributions, please visit our GitHub repository or open an issue.

## Acknowledgments

Built with cutting-edge Fully Homomorphic Encryption technology to bring privacy and security to sports contract management.

---

**Note**: This is experimental technology. Always verify contract addresses and test thoroughly before handling real assets.
