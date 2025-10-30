import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { FhevmProvider, useFhevmClient, useFhevmInit, useEncryptedInput } from '@fhevm-sdk/core';

// Contract ABI
const CONTRACT_ABI = [
  "function contractOwner() view returns (address)",
  "function currentSeason() view returns (uint256)",
  "function totalTeams() view returns (uint256)",
  "function registerTeam(string _teamName, string _league, address _teamManager, bytes32, bytes) returns (uint256)",
  "function registerAthlete(string _name, string _position, uint256 _teamId, address _athleteAddress, bytes32, bytes, uint256 _contractDurationMonths) returns (uint256)",
  "function proposeContract(uint256 _athleteId, uint256 _teamId, bytes32, bytes, uint256 _contractDuration) returns (uint256)",
  "function approveContract(uint256 _proposalId)",
  "function getAthleteInfo(uint256 _athleteId) view returns (string name, string position, uint256 teamId, bool isActive, uint256 contractStart, uint256 contractEnd, address athleteAddress)",
  "function getTeamInfo(uint256 _teamId) view returns (string teamName, string league, address teamManager, uint256[] athleteIds, bool isActive)",
  "function getProposalInfo(uint256 _proposalId) view returns (uint256 athleteId, uint256 teamId, uint256 contractDuration, bool isPending, bool isApproved, address proposer, uint256 timestamp)",
  "function getCurrentStats() view returns (uint256 season, uint256 totalAthletes, uint256 activeTeams, uint256 totalProposals)",
  "function checkSalaryCap(uint256 _teamId) view returns (bool)"
];

const CONTRACT_ADDRESS = "0x0A42624B5d5e1400556a3487f2171423c57519e0";

function SportsContractApp() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [stats, setStats] = useState({ season: '-', totalAthletes: '-', activeTeams: '-', totalProposals: '-' });
  const [messages, setMessages] = useState([]);
  const [queryResults, setQueryResults] = useState(null);

  const client = useFhevmClient();
  const { isInitialized } = useFhevmInit(provider);

  useEffect(() => {
    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  useEffect(() => {
    if (contract) {
      loadStats();
    }
  }, [contract]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        showMessage('Please install MetaMask to use this application.', 'error');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setUserAddress(accounts[0]);

      const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Signer);
      setContract(contractInstance);

      showMessage('Wallet connected successfully!', 'success');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showMessage('Failed to connect wallet: ' + error.message, 'error');
    }
  };

  const loadStats = async () => {
    if (!contract) return;

    try {
      const result = await contract.getCurrentStats();
      setStats({
        season: result.season.toString(),
        totalAthletes: result.totalAthletes.toString(),
        activeTeams: result.activeTeams.toString(),
        totalProposals: result.totalProposals.toString()
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      showMessage('Failed to load contract stats', 'error');
    }
  };

  const registerTeam = async (e) => {
    e.preventDefault();
    if (!contract || !isInitialized) {
      showMessage('Please connect your wallet and wait for FHEVM initialization', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const teamName = formData.get('teamName');
    const league = formData.get('league');
    const teamManager = formData.get('teamManager');
    const salaryCap = parseInt(formData.get('salaryCap'));

    try {
      showMessage('Encrypting salary cap...', 'info');

      const instance = client.getInstance();
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
      input.add32(salaryCap);
      const encryptedData = await input.encrypt();

      showMessage('Registering team... Please confirm transaction', 'info');

      const tx = await contract.registerTeam(
        teamName,
        league,
        teamManager,
        encryptedData.handles[0],
        encryptedData.inputProof
      );

      showMessage('Transaction submitted. Waiting for confirmation...', 'info');
      await tx.wait();

      showMessage(`Team "${teamName}" registered successfully!`, 'success');
      e.target.reset();
      await loadStats();
    } catch (error) {
      console.error('Error registering team:', error);
      showMessage('Failed to register team: ' + error.message, 'error');
    }
  };

  const registerAthlete = async (e) => {
    e.preventDefault();
    if (!contract || !isInitialized) {
      showMessage('Please connect your wallet and wait for FHEVM initialization', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const name = formData.get('athleteName');
    const position = formData.get('position');
    const teamId = parseInt(formData.get('athleteTeam'));
    const athleteAddress = formData.get('athleteAddress');
    const salary = parseInt(formData.get('salary'));
    const bonus = parseInt(formData.get('bonus'));
    const duration = parseInt(formData.get('contractDuration'));

    try {
      showMessage('Encrypting salary and bonus...', 'info');

      const instance = client.getInstance();
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
      input.add32(salary);
      input.add32(bonus);
      const encryptedData = await input.encrypt();

      showMessage('Registering athlete... Please confirm transaction', 'info');

      const tx = await contract.registerAthlete(
        name,
        position,
        teamId,
        athleteAddress,
        encryptedData.handles[0],
        encryptedData.inputProof,
        duration
      );

      showMessage('Transaction submitted. Waiting for confirmation...', 'info');
      await tx.wait();

      showMessage(`Athlete "${name}" registered successfully!`, 'success');
      e.target.reset();
      await loadStats();
    } catch (error) {
      console.error('Error registering athlete:', error);
      showMessage('Failed to register athlete: ' + error.message, 'error');
    }
  };

  const proposeContract = async (e) => {
    e.preventDefault();
    if (!contract || !isInitialized) {
      showMessage('Please connect your wallet and wait for FHEVM initialization', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const athleteId = parseInt(formData.get('proposalAthleteId'));
    const teamId = parseInt(formData.get('proposalTeamId'));
    const salary = parseInt(formData.get('proposedSalary'));
    const bonus = parseInt(formData.get('proposedBonus'));
    const duration = parseInt(formData.get('proposalDuration'));

    try {
      showMessage('Encrypting proposal terms...', 'info');

      const instance = client.getInstance();
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
      input.add32(salary);
      input.add32(bonus);
      const encryptedData = await input.encrypt();

      showMessage('Proposing contract... Please confirm transaction', 'info');

      const tx = await contract.proposeContract(
        athleteId,
        teamId,
        encryptedData.handles[0],
        encryptedData.inputProof,
        duration
      );

      showMessage('Transaction submitted. Waiting for confirmation...', 'info');
      await tx.wait();

      showMessage('Contract proposal submitted successfully!', 'success');
      e.target.reset();
      await loadStats();
    } catch (error) {
      console.error('Error proposing contract:', error);
      showMessage('Failed to propose contract: ' + error.message, 'error');
    }
  };

  const executeQuery = async (e) => {
    e.preventDefault();
    if (!contract) {
      showMessage('Please connect your wallet first', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const queryType = formData.get('queryType');
    const queryId = formData.get('queryId');

    try {
      let result;
      let display;

      switch (queryType) {
        case 'athlete':
          if (!queryId) {
            showMessage('Please enter athlete ID', 'error');
            return;
          }
          result = await contract.getAthleteInfo(parseInt(queryId));
          display = (
            <div className="data-item">
              <h3>Athlete Information (ID: {queryId})</h3>
              <p><strong>Name:</strong> {result.name}</p>
              <p><strong>Position:</strong> {result.position}</p>
              <p><strong>Team ID:</strong> {result.teamId.toString()}</p>
              <p><strong>Active:</strong> {result.isActive ? 'Yes' : 'No'}</p>
              <p><strong>Contract Start:</strong> {new Date(Number(result.contractStart) * 1000).toLocaleDateString()}</p>
              <p><strong>Contract End:</strong> {new Date(Number(result.contractEnd) * 1000).toLocaleDateString()}</p>
              <p><strong>Address:</strong> {result.athleteAddress}</p>
            </div>
          );
          break;

        case 'team':
          if (!queryId) {
            showMessage('Please enter team ID', 'error');
            return;
          }
          result = await contract.getTeamInfo(parseInt(queryId));
          display = (
            <div className="data-item">
              <h3>Team Information (ID: {queryId})</h3>
              <p><strong>Team Name:</strong> {result.teamName}</p>
              <p><strong>League:</strong> {result.league}</p>
              <p><strong>Manager:</strong> {result.teamManager}</p>
              <p><strong>Athletes Count:</strong> {result.athleteIds.length}</p>
              <p><strong>Active:</strong> {result.isActive ? 'Yes' : 'No'}</p>
              <p><strong>Athlete IDs:</strong> {result.athleteIds.map(id => id.toString()).join(', ')}</p>
            </div>
          );
          break;

        case 'proposal':
          if (!queryId) {
            showMessage('Please enter proposal ID', 'error');
            return;
          }
          result = await contract.getProposalInfo(parseInt(queryId));
          display = (
            <div className="data-item">
              <h3>Proposal Information (ID: {queryId})</h3>
              <p><strong>Athlete ID:</strong> {result.athleteId.toString()}</p>
              <p><strong>Team ID:</strong> {result.teamId.toString()}</p>
              <p><strong>Contract Duration:</strong> {result.contractDuration.toString()} months</p>
              <p><strong>Status:</strong> {result.isPending ? 'Pending' : (result.isApproved ? 'Approved' : 'Rejected')}</p>
              <p><strong>Proposer:</strong> {result.proposer}</p>
              <p><strong>Timestamp:</strong> {new Date(Number(result.timestamp) * 1000).toLocaleString()}</p>
            </div>
          );
          break;

        case 'stats':
          result = await contract.getCurrentStats();
          display = (
            <div className="data-item">
              <h3>Contract Statistics</h3>
              <p><strong>Current Season:</strong> {result.season.toString()}</p>
              <p><strong>Total Athletes:</strong> {result.totalAthletes.toString()}</p>
              <p><strong>Active Teams:</strong> {result.activeTeams.toString()}</p>
              <p><strong>Total Proposals:</strong> {result.totalProposals.toString()}</p>
            </div>
          );
          break;
      }

      setQueryResults(display);
    } catch (error) {
      console.error('Error executing query:', error);
      showMessage('Query failed: ' + error.message, 'error');
      setQueryResults(null);
    }
  };

  const showMessage = (message, type) => {
    const newMessage = { id: Date.now(), message, type };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }, 5000);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Confidential Sports Contract Management</h1>
        <p>Privacy-preserving athlete salary management using Fully Homomorphic Encryption</p>
      </div>

      <div className="privacy-notice">
        <strong>Privacy Notice:</strong> All salary data is encrypted using FHE technology.
        Only authorized parties can view confidential information.
      </div>

      <div className="wallet-section">
        <div className={`connection-status ${userAddress ? 'connected' : 'disconnected'}`}>
          <span>{userAddress ? '✅' : '❌'}</span>
          <span>{userAddress ? `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Wallet Not Connected'}</span>
        </div>
        <button className="btn" onClick={connectWallet} disabled={!!userAddress}>
          {userAddress ? 'Connected' : 'Connect Wallet'}
        </button>
        {!isInitialized && userAddress && (
          <div className="status-message info" style={{ marginTop: '1rem' }}>
            FHEVM Initializing... Please wait
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-number">{stats.season}</span>
          <div className="stat-label">Current Season</div>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalAthletes}</span>
          <div className="stat-label">Total Athletes</div>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.activeTeams}</span>
          <div className="stat-label">Active Teams</div>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalProposals}</span>
          <div className="stat-label">Contract Proposals</div>
        </div>
      </div>

      <div className="main-content">
        {/* Team Registration */}
        <div className="card">
          <h2>Register Team</h2>
          <form onSubmit={registerTeam}>
            <div className="form-group">
              <label htmlFor="teamName">Team Name:</label>
              <input type="text" name="teamName" id="teamName" placeholder="e.g., Barcelona FC" required />
            </div>
            <div className="form-group">
              <label htmlFor="league">League:</label>
              <input type="text" name="league" id="league" placeholder="e.g., La Liga" required />
            </div>
            <div className="form-group">
              <label htmlFor="teamManager">Team Manager Address:</label>
              <input type="text" name="teamManager" id="teamManager" placeholder="0x..." required />
            </div>
            <div className="form-group">
              <label htmlFor="salaryCap">Salary Cap (USD):</label>
              <input type="number" name="salaryCap" id="salaryCap" placeholder="50000000" required />
            </div>
            <button type="submit" className="btn">Register Team</button>
          </form>
        </div>

        {/* Athlete Registration */}
        <div className="card">
          <h2>Register Athlete</h2>
          <form onSubmit={registerAthlete}>
            <div className="form-group">
              <label htmlFor="athleteName">Athlete Name:</label>
              <input type="text" name="athleteName" id="athleteName" placeholder="e.g., Lionel Messi" required />
            </div>
            <div className="form-group">
              <label htmlFor="position">Position:</label>
              <select name="position" id="position" required>
                <option value="">Select Position</option>
                <option value="Forward">Forward</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Defender">Defender</option>
                <option value="Goalkeeper">Goalkeeper</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="athleteTeam">Team ID:</label>
              <input type="number" name="athleteTeam" id="athleteTeam" placeholder="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="athleteAddress">Athlete Address:</label>
              <input type="text" name="athleteAddress" id="athleteAddress" placeholder="0x..." required />
            </div>
            <div className="form-group">
              <label htmlFor="salary">Annual Salary (USD):</label>
              <input type="number" name="salary" id="salary" placeholder="30000000" required />
            </div>
            <div className="form-group">
              <label htmlFor="bonus">Performance Bonus (USD):</label>
              <input type="number" name="bonus" id="bonus" placeholder="5000000" required />
            </div>
            <div className="form-group">
              <label htmlFor="contractDuration">Contract Duration (Months):</label>
              <input type="number" name="contractDuration" id="contractDuration" placeholder="24" required />
            </div>
            <button type="submit" className="btn">Register Athlete</button>
          </form>
        </div>

        {/* Contract Proposal */}
        <div className="card">
          <h2>Propose Contract</h2>
          <form onSubmit={proposeContract}>
            <div className="form-group">
              <label htmlFor="proposalAthleteId">Athlete ID:</label>
              <input type="number" name="proposalAthleteId" id="proposalAthleteId" placeholder="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="proposalTeamId">Team ID:</label>
              <input type="number" name="proposalTeamId" id="proposalTeamId" placeholder="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="proposedSalary">Proposed Salary (USD):</label>
              <input type="number" name="proposedSalary" id="proposedSalary" placeholder="35000000" required />
            </div>
            <div className="form-group">
              <label htmlFor="proposedBonus">Proposed Bonus (USD):</label>
              <input type="number" name="proposedBonus" id="proposedBonus" placeholder="7000000" required />
            </div>
            <div className="form-group">
              <label htmlFor="proposalDuration">Contract Duration (Months):</label>
              <input type="number" name="proposalDuration" id="proposalDuration" placeholder="36" required />
            </div>
            <button type="submit" className="btn">Propose Contract</button>
          </form>
        </div>

        {/* Query Section */}
        <div className="card">
          <h2>Query Information</h2>
          <form onSubmit={executeQuery}>
            <div className="form-group">
              <label htmlFor="queryType">Query Type:</label>
              <select name="queryType" id="queryType" required>
                <option value="">Select Query</option>
                <option value="athlete">Athlete Info</option>
                <option value="team">Team Info</option>
                <option value="proposal">Proposal Info</option>
                <option value="stats">Contract Stats</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="queryId">ID (if applicable):</label>
              <input type="number" name="queryId" id="queryId" placeholder="Enter ID" />
            </div>
            <button type="submit" className="btn">Execute Query</button>
            {queryResults && (
              <div className="data-list">
                {queryResults}
              </div>
            )}
          </form>
        </div>
      </div>

      <div id="statusMessages">
        {messages.map(msg => (
          <div key={msg.id} className={`status-message ${msg.type}`}>
            {msg.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <FhevmProvider config={{ network: { chainId: 11155111 } }}>
      <SportsContractApp />
    </FhevmProvider>
  );
}

export default App;
