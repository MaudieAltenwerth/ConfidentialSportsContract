const hre = require('hardhat');

async function main() {
  console.log('Deploying Confidential Sports Contract...\n');

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH\n');

  // Deploy contract
  console.log('Deploying contract...');
  const ConfidentialSportsContract = await hre.ethers.getContractFactory(
    'ConfidentialSportsContract'
  );

  const contract = await ConfidentialSportsContract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('Contract deployed to:', address);

  // Get deployment transaction
  const deployTx = contract.deploymentTransaction();
  if (deployTx) {
    console.log('Deployment transaction hash:', deployTx.hash);
    console.log('Block number:', deployTx.blockNumber);
  }

  // Verify contract owner
  const owner = await contract.contractOwner();
  console.log('Contract owner:', owner);

  // Get initial stats
  const stats = await contract.getCurrentStats();
  console.log('\nInitial Contract Stats:');
  console.log('- Current Season:', stats[0].toString());
  console.log('- Total Athletes:', stats[1].toString());
  console.log('- Active Teams:', stats[2].toString());
  console.log('- Total Proposals:', stats[3].toString());

  console.log('\n✅ Deployment successful!');
  console.log('\nNext steps:');
  console.log('1. Save the contract address:', address);
  console.log('2. Verify on Etherscan: npx hardhat verify --network sepolia', address);
  console.log('3. Update frontend config with this address');

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployer: deployer.address,
    deploymentBlock: deployTx?.blockNumber || 'unknown',
    timestamp: new Date().toISOString(),
  };

  console.log('\nDeployment Info:');
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
