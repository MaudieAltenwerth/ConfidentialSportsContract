# Deployment Guide

Complete deployment documentation for the Confidential Sports Contract smart contract system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment Process](#deployment-process)
- [Contract Verification](#contract-verification)
- [Post-Deployment](#post-deployment)
- [Network Information](#network-information)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying the contract, ensure you have the following:

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

### Required Accounts

- **Ethereum Wallet**: MetaMask or similar wallet with private key
- **Etherscan API Key**: For contract verification ([Get it here](https://etherscan.io/myapikey))
- **Testnet ETH**: For Sepolia deployment ([Sepolia Faucet](https://sepoliafaucet.com/))

### Knowledge Requirements

- Basic understanding of Ethereum and smart contracts
- Familiarity with command-line interfaces
- Understanding of environment variables and security

---

## Environment Setup

### 1. Clone or Navigate to Project

```bash
cd /path/to/confidential-sports-contract
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Hardhat and plugins
- Ethers.js v6
- FHE Solidity libraries
- Development tools

### 3. Verify Installation

```bash
npx hardhat --version
```

Expected output: `2.19.4` or higher

---

## Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your actual values:

```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://eth.llamarpc.com

# Your wallet private key (KEEP THIS SECRET!)
PRIVATE_KEY=0xYourPrivateKeyHere

# Etherscan API key for verification
ETHERSCAN_API_KEY=YourEtherscanApiKeyHere

# Optional: Gas reporting
REPORT_GAS=false
COINMARKETCAP_API_KEY=YourCoinMarketCapApiKeyHere
```

**⚠️ SECURITY WARNING**: Never commit your `.env` file or share your private key!

### 3. Verify Configuration

Test your configuration:

```bash
npx hardhat accounts
```

This should display your account address.

---

## Deployment Process

### Step 1: Compile Contracts

Compile the smart contracts to ensure there are no syntax errors:

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 2: Deploy to Local Network (Optional)

For testing, deploy to a local Hardhat network first:

```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy to local network
npm run deploy:local
```

### Step 3: Deploy to Sepolia Testnet

Deploy the contract to Sepolia testnet:

```bash
npm run deploy
```

**Deployment Output**:

```
╔════════════════════════════════════════════════════════════╗
║   Confidential Sports Contract Deployment                 ║
╚════════════════════════════════════════════════════════════╝

📡 Network: sepolia
⛓️  Chain ID: 11155111

👤 Deployer Information:
   Address: 0xYourAddressHere
   Balance: 0.5 ETH

🚀 Deploying ConfidentialSportsContract...

✅ Contract deployed successfully!

📋 Deployment Details:
   Contract Address: 0xContractAddressHere
   Transaction Hash: 0xTransactionHashHere
   Block Number: 1234567
   Deployment Time: 15.43s
   Gas Used: 3500000
```

### Step 4: Save Deployment Information

Deployment details are automatically saved to:
```
deployments/sepolia-deployment.json
```

This file contains:
- Contract address
- Deployer address
- Transaction hash
- Deployment timestamp
- Network information

---

## Contract Verification

### Verify on Etherscan

After successful deployment, verify your contract:

```bash
npm run verify
```

**Verification Output**:

```
╔════════════════════════════════════════════════════════════╗
║   Contract Verification on Etherscan                      ║
╚════════════════════════════════════════════════════════════╝

📡 Network: sepolia

📋 Contract Information:
   Address: 0xContractAddressHere
   Network: sepolia
   Deployer: 0xYourAddressHere

🔍 Starting verification process...
   This may take a few moments...

✅ Contract verified successfully!

🔗 View verified contract:
   https://sepolia.etherscan.io/address/0xContractAddressHere#code
```

### Manual Verification (If Automated Fails)

If automated verification fails, you can verify manually:

1. Visit [Sepolia Etherscan](https://sepolia.etherscan.io)
2. Navigate to your contract address
3. Click "Contract" → "Verify and Publish"
4. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.24
   - License: MIT
5. Paste your contract code
6. Submit for verification

---

## Post-Deployment

### 1. Test Contract Interaction

Run the interaction script to verify contract functionality:

```bash
npm run interact
```

### 2. Run Full Simulation

Execute a complete workflow simulation:

```bash
npm run simulate
```

This will:
- Register multiple teams
- Register athletes with encrypted salaries
- Create contract proposals
- Approve contracts
- Update salaries
- Check salary cap compliance
- Start a new season

### 3. Update README

Update the main README.md with the new contract address:

```markdown
**Contract Address**: `0xYourNewContractAddress`
```

---

## Network Information

### Sepolia Testnet

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **Currency**: SepoliaETH (Test ETH)
- **RPC URL**: https://rpc.sepolia.org
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucets**:
  - https://sepoliafaucet.com/
  - https://www.alchemy.com/faucets/ethereum-sepolia

### Ethereum Mainnet

- **Network Name**: Ethereum Mainnet
- **Chain ID**: 1
- **Currency**: ETH
- **RPC URL**: https://eth.llamarpc.com
- **Block Explorer**: https://etherscan.io

**⚠️ WARNING**: Deploying to mainnet requires real ETH and is permanent. Always test thoroughly on testnet first!

---

## Deployed Contract Information

### Current Deployment

**Network**: Sepolia Testnet
**Contract Address**: `0x0A42624B5d5e1400556a3487f2171423c57519e0`
**Etherscan**: [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x0A42624B5d5e1400556a3487f2171423c57519e0)

### Contract Features

- ✅ Fully Homomorphic Encryption (FHE) enabled
- ✅ Encrypted salary storage
- ✅ Privacy-preserving contract management
- ✅ Role-based access control
- ✅ Multi-team support
- ✅ Contract proposal system

### Contract Owner Functions

Only the contract owner can execute:
- `registerTeam()` - Register new teams
- `startNewSeason()` - Start a new season
- `deactivateTeam()` - Deactivate a team

### Team Manager Functions

Team managers can execute:
- `registerAthlete()` - Register athletes to their team
- `proposeContract()` - Propose contracts to athletes
- `updateAthleteSalary()` - Update athlete compensation
- `deactivateAthlete()` - Deactivate athletes

### Athlete Functions

Athletes can execute:
- `approveContract()` - Approve contract proposals

### Public View Functions

Anyone can call:
- `getAthleteInfo()` - Get athlete information
- `getTeamInfo()` - Get team information
- `getProposalInfo()` - Get proposal details
- `getCurrentStats()` - Get current statistics
- `checkSalaryCap()` - Check salary cap compliance

---

## Gas Costs

### Estimated Gas Usage

| Operation | Estimated Gas | Cost @ 50 Gwei |
|-----------|---------------|----------------|
| Contract Deployment | ~3,500,000 | ~0.175 ETH |
| Register Team | ~250,000 | ~0.0125 ETH |
| Register Athlete | ~350,000 | ~0.0175 ETH |
| Propose Contract | ~200,000 | ~0.01 ETH |
| Approve Contract | ~150,000 | ~0.0075 ETH |
| Update Salary | ~180,000 | ~0.009 ETH |
| Start New Season | ~50,000 | ~0.0025 ETH |

**Note**: Actual gas costs may vary based on network congestion and gas prices.

---

## Troubleshooting

### Common Issues

#### 1. "Insufficient funds for gas"

**Solution**: Ensure your wallet has enough ETH for deployment and gas fees.

```bash
# Check your balance
npx hardhat run scripts/check-balance.js --network sepolia
```

#### 2. "Network connection error"

**Solution**:
- Check your RPC URL in `.env`
- Try alternative RPC providers:
  - `https://ethereum-sepolia.publicnode.com`
  - `https://rpc2.sepolia.org`

#### 3. "Private key error"

**Solution**:
- Ensure private key is in correct format (starts with `0x`)
- Verify the private key is from the correct wallet
- Check `.env` file is properly formatted

#### 4. "Contract verification failed"

**Solution**:
- Wait 1-2 minutes after deployment
- Verify Etherscan API key is correct
- Try manual verification on Etherscan

#### 5. "FHE library import error"

**Solution**:
```bash
npm install @fhevm/solidity@latest
npm run compile
```

### Getting Help

If you encounter issues not covered here:

1. Check Hardhat documentation: https://hardhat.org/docs
2. Review Ethers.js docs: https://docs.ethers.org/v6/
3. Search existing issues on GitHub
4. Contact the development team

---

## Security Considerations

### Best Practices

1. **Private Key Security**
   - Never commit `.env` file
   - Use hardware wallets for mainnet
   - Rotate keys regularly

2. **Contract Security**
   - Audit contract code before mainnet deployment
   - Test extensively on testnet
   - Use multi-signature wallets for contract ownership

3. **Access Control**
   - Verify owner address after deployment
   - Document all privileged roles
   - Implement timelock for critical operations

4. **Monitoring**
   - Monitor contract events
   - Set up alerts for large transactions
   - Regular security audits

### Security Checklist

- [ ] Contract code audited
- [ ] Comprehensive tests written and passing
- [ ] Deployment tested on testnet
- [ ] Private keys secured
- [ ] Environment variables configured
- [ ] Etherscan verification completed
- [ ] Access control verified
- [ ] Emergency procedures documented

---

## Maintenance

### Regular Tasks

1. **Monitor Contract Activity**
   - Review events and transactions
   - Check for unusual patterns
   - Verify encryption integrity

2. **Update Documentation**
   - Keep deployment records current
   - Document configuration changes
   - Update team and athlete information

3. **Backup Important Data**
   - Save deployment files
   - Export contract state periodically
   - Maintain secure key backups

---

## Additional Resources

### Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [FHE Solidity Library](https://github.com/zama-ai/fhevm)
- [Ethereum Development Guide](https://ethereum.org/en/developers/)

### Tools

- [Hardhat Network](https://hardhat.org/hardhat-network/)
- [Etherscan](https://etherscan.io)
- [MetaMask](https://metamask.io)
- [Remix IDE](https://remix.ethereum.org)

### Community

- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [Hardhat Discord](https://hardhat.org/discord)
- [r/ethdev](https://reddit.com/r/ethdev)

---

## Changelog

### Version 1.0.0 (Current)

- ✅ Initial deployment framework
- ✅ Hardhat configuration
- ✅ Complete script suite (deploy, verify, interact, simulate)
- ✅ Comprehensive documentation
- ✅ FHE integration
- ✅ Sepolia testnet support

---

## License

MIT License - See LICENSE file for details

---

## Contact

For questions or support regarding deployment:

- Review this documentation first
- Check troubleshooting section
- Consult Hardhat and Ethers.js documentation
- Submit issues with detailed error logs

---

**Last Updated**: 2025-10-29
**Contract Version**: 1.0.0
**Hardhat Version**: 2.19.4
**Solidity Version**: 0.8.24
