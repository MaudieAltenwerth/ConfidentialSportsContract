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

**Network**: Sepolia Testnet

**Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x0A42624B5d5e1400556a3487f2171423c57519e0)

The FHE-enabled smart contract manages all confidential operations.

## Technology Stack

- **Development Framework**: Hardhat v2.19.4
- **Blockchain**: Ethereum-compatible network with FHE support
- **Smart Contracts**: Solidity v0.8.24 with FHE libraries
- **Testing**: Hardhat test suite with Chai assertions
- **Web3**: Ethers.js v6 for blockchain interaction

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

### Scripts

```bash
# Compile
npm run compile

# Test
npm test

# Deploy
npm run deploy

# Verify
npm run verify

# Interact
npm run interact

# Simulate
npm run simulate
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guide](CONTRIBUTING.md)

## License

MIT License
