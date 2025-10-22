# CI/CD Documentation

Comprehensive Continuous Integration and Continuous Deployment documentation for the Confidential Sports Contract project.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Code Quality Checks](#code-quality-checks)
- [Test Coverage](#test-coverage)
- [Deployment Automation](#deployment-automation)
- [Secrets Configuration](#secrets-configuration)
- [Badge Integration](#badge-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project uses GitHub Actions for automated testing, code quality checks, and deployment processes. The CI/CD pipeline ensures code quality, security, and reliability before any changes are merged or deployed.

### Key Features

- ✅ Automated testing on multiple Node.js versions (18.x, 20.x)
- ✅ Cross-platform testing (Ubuntu, Windows)
- ✅ Code quality checks (ESLint, Prettier, Solhint)
- ✅ Security audits
- ✅ Test coverage reporting with Codecov
- ✅ Automated deployment to testnets
- ✅ Contract verification automation

---

## GitHub Actions Workflows

### 1. Test Suite (`test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Test Matrix**: Runs on Node.js 18.x and 20.x
- **Platforms**: Ubuntu Latest and Windows Latest
- **Steps**:
  1. Checkout repository
  2. Setup Node.js with caching
  3. Install dependencies (`npm ci`)
  4. Compile contracts
  5. Run test suite
  6. Generate coverage report (Ubuntu + Node 20.x only)
  7. Upload coverage to Codecov

**Example:**
```yaml
name: Test Suite
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### 2. Code Quality (`quality.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint Job
- Check code formatting with Prettier
- Lint JavaScript/TypeScript with ESLint
- Lint Solidity contracts with Solhint

#### Security Job
- Run `npm audit` for dependency vulnerabilities
- Report security issues (non-blocking)

#### Build Job
- Verify contracts compile successfully
- Test clean build process

**Commands:**
```bash
npm run prettier:check  # Check formatting
npm run lint            # Lint JavaScript
npm run lint:sol        # Lint Solidity
npm audit               # Security audit
```

### 3. Manual Workflow (`manual.yml`)

**Trigger:** Manual dispatch via GitHub UI

**Features:**
- Environment selection (development, staging, production)
- Complete quality checks
- Full test suite
- Coverage report generation

**Usage:**
1. Go to Actions tab in GitHub
2. Select "Manual Workflow"
3. Click "Run workflow"
4. Choose environment
5. Click "Run workflow" button

### 4. Deploy Workflow (`deploy.yml`)

**Trigger:** Manual dispatch

**Features:**
- Network selection (sepolia, localhost)
- Pre-deployment testing
- Automated contract deployment
- Artifact upload for deployment records

**Required Secrets:**
- `PRIVATE_KEY`
- `SEPOLIA_RPC_URL`
- `ETHERSCAN_API_KEY`

### 5. Verify Workflow (`verify.yml`)

**Trigger:** Manual dispatch

**Features:**
- Network selection (sepolia, mainnet)
- Automated Etherscan verification

**Required Secrets:**
- `ETHERSCAN_API_KEY`
- `PRIVATE_KEY`
- `SEPOLIA_RPC_URL`

---

## Code Quality Checks

### ESLint Configuration

Located in `.eslintrc.json`:

```json
{
  "env": {
    "node": true,
    "es2021": true,
    "mocha": true
  },
  "extends": ["eslint:recommended"],
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "double"],
    "semi": ["error", "always"]
  }
}
```

**Run ESLint:**
```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
```

### Prettier Configuration

Located in `.prettierrc.json`:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false
}
```

**Run Prettier:**
```bash
npm run format          # Format all files
npm run prettier:check  # Check formatting
```

### Solhint Configuration

Located in `.solhint.json`:

```json
{
  "extends": "solhint:recommended",
  "rules": {
    "compiler-version": ["error", "^0.8.0"],
    "func-visibility": ["warn"],
    "max-line-length": ["warn", 120]
  }
}
```

**Run Solhint:**
```bash
npm run lint:sol  # Lint Solidity contracts
```

---

## Test Coverage

### Codecov Integration

**Configuration:** `codecov.yml`

```yaml
coverage:
  precision: 2
  round: down
  range: "70...100"
  status:
    project:
      default:
        target: 70%
        threshold: 5%
```

**Features:**
- Automatic coverage reporting
- Pull request comments with coverage changes
- Coverage badges
- Line-by-line coverage view

### Generating Coverage Reports

```bash
# Local coverage report
npm run coverage

# View report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### Coverage Metrics

- **Target Coverage**: 70%
- **Threshold**: 5% (allows small decreases)
- **Ignored Files**:
  - `node_modules/`
  - `test/`
  - `scripts/`
  - Configuration files

---

## Deployment Automation

### Manual Deployment

**Via GitHub Actions:**

1. Navigate to Actions tab
2. Select "Deploy to Testnet"
3. Click "Run workflow"
4. Select network (sepolia/localhost)
5. Confirm deployment

**Required Environment Variables:**
```bash
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Local Deployment

```bash
# Deploy to Sepolia
npm run deploy

# Deploy to local network
npm run node          # Terminal 1
npm run deploy:local  # Terminal 2

# Verify contract
npm run verify
```

### Deployment Artifacts

After successful deployment, artifacts are uploaded including:
- Contract addresses
- Deployment transaction hashes
- ABI files
- Deployment timestamp
- Network information

**Retention**: 30 days

---

## Secrets Configuration

### GitHub Repository Secrets

Navigate to: **Settings > Secrets and variables > Actions**

#### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PRIVATE_KEY` | Wallet private key for deployment | `0x1234...` |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint | `https://rpc.sepolia.org` |
| `ETHERSCAN_API_KEY` | Etherscan API key for verification | `ABC123...` |
| `CODECOV_TOKEN` | Codecov upload token | `abc-def-ghi` |

#### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `MAINNET_RPC_URL` | Mainnet RPC endpoint (production) |
| `COINMARKETCAP_API_KEY` | For gas cost estimation |

### Setting Up Secrets

1. Go to repository **Settings**
2. Navigate to **Secrets and variables > Actions**
3. Click **New repository secret**
4. Enter secret name and value
5. Click **Add secret**

---

## Badge Integration

### Adding Status Badges to README

```markdown
## Status

[![Test Suite](https://github.com/username/repo/workflows/Test%20Suite/badge.svg)](https://github.com/username/repo/actions/workflows/test.yml)
[![Code Quality](https://github.com/username/repo/workflows/Code%20Quality/badge.svg)](https://github.com/username/repo/actions/workflows/quality.yml)
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

### Available Badges

- **Test Suite**: Shows test passing/failing status
- **Code Quality**: Shows linting status
- **Coverage**: Shows test coverage percentage
- **License**: Shows project license

---

## Workflow Status

### Checking Workflow Status

1. Go to **Actions** tab in repository
2. View recent workflow runs
3. Click on a run to see details
4. Review logs for each job

### Understanding Status Icons

- ✅ **Success**: All checks passed
- ❌ **Failure**: One or more checks failed
- 🟡 **In Progress**: Workflow is running
- ⚪ **Pending**: Workflow is queued
- ⊘ **Cancelled**: Workflow was cancelled

---

## NPM Scripts Reference

### Testing
```bash
npm test              # Run test suite
npm run coverage      # Generate coverage report
npm run test:coverage # Alias for coverage
```

### Code Quality
```bash
npm run lint          # Lint JavaScript files
npm run lint:sol      # Lint Solidity files
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format all files
npm run prettier:check # Check formatting
```

### Compilation
```bash
npm run compile       # Compile contracts
npm run clean         # Clean artifacts
```

### Deployment
```bash
npm run deploy        # Deploy to Sepolia
npm run deploy:local  # Deploy to localhost
npm run verify        # Verify on Etherscan
npm run interact      # Interact with contract
npm run simulate      # Run simulation
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Failing in CI but Passing Locally

**Possible Causes:**
- Environment variable differences
- Node version mismatch
- Dependency version differences

**Solutions:**
```bash
# Use same Node version as CI
nvm use 20

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests
npm test
```

#### 2. Codecov Upload Failing

**Possible Causes:**
- Missing `CODECOV_TOKEN` secret
- Coverage file not generated
- Network issues

**Solutions:**
1. Verify `CODECOV_TOKEN` is set in repository secrets
2. Check coverage file exists: `coverage/lcov.info`
3. Retry the workflow

#### 3. Linting Failures

**Quick Fix:**
```bash
# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Commit changes
git add .
git commit -m "Fix linting issues"
```

#### 4. Compilation Errors in CI

**Check:**
- Solidity version compatibility
- Missing dependencies
- Import paths

**Debug:**
```bash
# Clean and rebuild
npm run clean
npm run compile
```

#### 5. Deployment Workflow Failures

**Common Issues:**
- Missing secrets
- Insufficient gas
- Network connection issues

**Solutions:**
1. Verify all required secrets are configured
2. Check wallet balance
3. Verify RPC URL is accessible
4. Review deployment logs

---

## Best Practices

### Before Pushing Code

```bash
# 1. Format code
npm run format

# 2. Run linting
npm run lint
npm run lint:sol

# 3. Run tests
npm test

# 4. Generate coverage
npm run coverage

# 5. Commit changes
git add .
git commit -m "Your commit message"
git push
```

### Pull Request Checklist

- [ ] All tests passing
- [ ] Code formatted and linted
- [ ] Coverage maintained or improved
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Reviewed by at least one peer

### Deployment Checklist

- [ ] All tests passing on main branch
- [ ] Code reviewed and approved
- [ ] Secrets configured correctly
- [ ] Network selection correct
- [ ] Wallet funded with enough ETH
- [ ] Deployment script tested locally
- [ ] Post-deployment verification plan ready

---

## Continuous Improvement

### Monitoring

- Review workflow runs regularly
- Track test coverage trends
- Monitor security audit results
- Review dependency updates

### Optimization

- Keep workflows fast (< 10 minutes)
- Cache dependencies effectively
- Run jobs in parallel when possible
- Use appropriate runner types

### Documentation

- Keep CI/CD documentation updated
- Document new workflows
- Share lessons learned
- Update troubleshooting guides

---

## Additional Resources

### GitHub Actions
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Contexts and Expressions](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions)

### Testing
- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)
- [Mocha Documentation](https://mochajs.org/)

### Code Quality
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)

### Coverage
- [Codecov Documentation](https://docs.codecov.com/)
- [Solidity Coverage](https://github.com/sc-forks/solidity-coverage)

---

## Support

For issues related to CI/CD:

1. Check this documentation
2. Review workflow logs
3. Search existing issues
4. Create new issue with:
   - Workflow name
   - Error message
   - Steps to reproduce
   - Environment details

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
**Maintained By**: Development Team
