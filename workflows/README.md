# GitHub Actions Workflows

This directory contains all CI/CD workflows for the Confidential Sports Contract project.

## Available Workflows

### 1. Test Suite (`test.yml`)
**Status**: [![Test Suite](../../workflows/Test%20Suite/badge.svg)](../../actions/workflows/test.yml)

**Triggers**: Push/PR to main or develop

**Purpose**: Run comprehensive test suite on multiple Node.js versions and platforms

**Jobs**:
- Run tests on Node 18.x and 20.x
- Test on Ubuntu and Windows
- Generate coverage reports
- Upload to Codecov

### 2. Code Quality (`quality.yml`)
**Status**: [![Code Quality](../../workflows/Code%20Quality/badge.svg)](../../actions/workflows/quality.yml)

**Triggers**: Push/PR to main or develop

**Purpose**: Ensure code quality standards

**Jobs**:
- Lint JavaScript/TypeScript (ESLint)
- Lint Solidity (Solhint)
- Format checking (Prettier)
- Security audit (npm audit)
- Build verification

### 3. Manual Workflow (`manual.yml`)
**Trigger**: Manual dispatch

**Purpose**: On-demand testing with environment selection

**Features**:
- Environment selection (development/staging/production)
- Full quality checks
- Complete test suite
- Coverage generation

### 4. Deploy (`deploy.yml`)
**Trigger**: Manual dispatch

**Purpose**: Automated contract deployment

**Features**:
- Network selection (sepolia/localhost)
- Pre-deployment testing
- Deployment execution
- Artifact storage

### 5. Verify (`verify.yml`)
**Trigger**: Manual dispatch

**Purpose**: Automated contract verification on Etherscan

**Features**:
- Network selection (sepolia/mainnet)
- Automated verification

## Running Workflows

### Automatic Workflows

These run automatically on push/PR:
- Test Suite
- Code Quality

No manual intervention required.

### Manual Workflows

To run manual workflows:

1. Go to **Actions** tab in repository
2. Select the workflow from the left sidebar
3. Click **Run workflow** button
4. Fill in required inputs
5. Click **Run workflow** to start

## Workflow Status

Check workflow status:
- Visit the **Actions** tab
- See recent runs and their status
- Click on a run for detailed logs

## Required Secrets

Configure these in **Settings > Secrets and variables > Actions**:

- `PRIVATE_KEY` - Wallet private key for deployment
- `SEPOLIA_RPC_URL` - Sepolia RPC endpoint
- `ETHERSCAN_API_KEY` - Etherscan API key
- `CODECOV_TOKEN` - Codecov upload token

## Workflow Matrix

| Workflow | Trigger | Node Versions | Platforms | Duration |
|----------|---------|---------------|-----------|----------|
| Test Suite | Auto | 18.x, 20.x | Ubuntu, Windows | ~5-10 min |
| Code Quality | Auto | 20.x | Ubuntu | ~3-5 min |
| Manual | Manual | 20.x | Ubuntu | ~5-10 min |
| Deploy | Manual | 20.x | Ubuntu | ~5-15 min |
| Verify | Manual | 20.x | Ubuntu | ~2-5 min |

## Troubleshooting

### Tests Failing

1. Check test logs in workflow run
2. Run tests locally: `npm test`
3. Verify dependencies: `npm ci`

### Quality Checks Failing

1. Run locally: `npm run lint` and `npm run prettier:check`
2. Auto-fix: `npm run lint:fix` and `npm run format`
3. Commit fixes and push

### Deployment Failing

1. Verify secrets are configured
2. Check wallet balance
3. Verify RPC URL accessibility
4. Review deployment logs

## Badge Integration

Add workflow status badges to README:

```markdown
[![Test Suite](https://github.com/username/repo/workflows/Test%20Suite/badge.svg)](https://github.com/username/repo/actions/workflows/test.yml)
[![Code Quality](https://github.com/username/repo/workflows/Code%20Quality/badge.svg)](https://github.com/username/repo/actions/workflows/quality.yml)
```

## Best Practices

1. **Always run tests locally before pushing**
2. **Keep workflows fast** (< 10 minutes)
3. **Use caching** for dependencies
4. **Monitor workflow runs** regularly
5. **Update workflows** as needed

## Documentation

For detailed CI/CD documentation, see [CI_CD.md](../../CI_CD.md)

## Support

For workflow issues:
1. Check logs in Actions tab
2. Review [CI_CD.md](../../CI_CD.md)
3. Create an issue if problem persists
