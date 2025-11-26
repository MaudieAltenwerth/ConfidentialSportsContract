require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-chai-matchers");
require("@fhevm/hardhat-plugin");

// Ensure ts-node compiles test TS files to CJS for Mocha
try {
  require("ts-node").register({
    transpileOnly: true,
    compilerOptions: { module: "commonjs" },
  });
} catch (e) {
  // ignore if ts-node not available here; hardhat will still run JS tests
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {},
  networks: {
    incentiv: {
      url: process.env.VITE_INCENTIV_RPC_URL || 'https://rpc.testnet.incentiv.net',
      chainId: 11690,
      accounts: process.env.VITE_PRIVATE_KEY ? [process.env.VITE_PRIVATE_KEY] : [],
    },
    "incentiv-testnet": {
      url: "https://explorer.incentiv.network/api/eth-rpc",
      chainId: 11690,
      accounts: process.env.VITE_PRIVATE_KEY ? [process.env.VITE_PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  sourcify: {
    enabled: true,
    apiUrl: process.env.NEXT_PUBLIC_SOURCIFY_URL || '',
    browserUrl: process.env.VITE_INCENTIV_EXPLORER || '',
  },
  etherscan: {
    apiKey: {
      "incentiv-testnet": "empty",
    },
    customChains: [
      {
        network: "incentiv-testnet",
        chainId: 11690,
        urls: {
          apiURL: "https://explorer.incentiv.network/api",
          browserURL: "https://explorer.incentiv.network",
        },
      },
    ],
  }
}; 