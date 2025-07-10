// Contract ABI - Replace with your actual contract ABI
const CONTRACT_ABI = [
    "function contractOwner() view returns (address)",
    "function currentSeason() view returns (uint256)",
    "function totalTeams() view returns (uint256)",
    "function registerTeam(string _teamName, string _league, address _teamManager, uint32 _salaryCap) returns (uint256)",
    "function registerAthlete(string _name, string _position, uint256 _teamId, address _athleteAddress, uint32 _salary, uint32 _bonus, uint256 _contractDurationMonths) returns (uint256)",
    "function proposeContract(uint256 _athleteId, uint256 _teamId, uint32 _proposedSalary, uint32 _proposedBonus, uint256 _contractDuration) returns (uint256)",
    "function approveContract(uint256 _proposalId)",
    "function getAthleteInfo(uint256 _athleteId) view returns (string name, string position, uint256 teamId, bool isActive, uint256 contractStart, uint256 contractEnd, address athleteAddress)",
    "function getTeamInfo(uint256 _teamId) view returns (string teamName, string league, address teamManager, uint256[] athleteIds, bool isActive)",
    "function getProposalInfo(uint256 _proposalId) view returns (uint256 athleteId, uint256 teamId, uint256 contractDuration, bool isPending, bool isApproved, address proposer, uint256 timestamp)",
    "function getCurrentStats() view returns (uint256 season, uint256 totalAthletes, uint256 activeTeams, uint256 totalProposals)",
    "function checkSalaryCap(uint256 _teamId) view returns (bool)",
    "event TeamRegistered(uint256 indexed teamId, string teamName, address manager)",
    "event AthleteRegistered(uint256 indexed athleteId, string name, uint256 teamId)",
    "event ContractProposed(uint256 indexed proposalId, uint256 athleteId, uint256 teamId)",
    "event ContractApproved(uint256 indexed proposalId, uint256 athleteId, uint256 teamId)"
];

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x0A42624B5d5e1400556a3487f2171423c57519e0";

class SportsContractDApp {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;

        this.initializeEventListeners();
        this.checkWalletConnection();
    }

    async checkWalletConnection() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.connectWallet();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    }

    initializeEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('registerTeam').addEventListener('click', () => this.registerTeam());
        document.getElementById('registerAthlete').addEventListener('click', () => this.registerAthlete());
        document.getElementById('proposeContract').addEventListener('click', () => this.proposeContract());
        document.getElementById('executeQuery').addEventListener('click', () => this.executeQuery());
    }

    async connectWallet() {
        try {
            if (!window.ethereum) {
                this.showMessage('Please install MetaMask to use this application.', 'error');
                return;
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = accounts[0];

            // Initialize contract
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

            this.updateWalletUI(true);
            this.showMessage('Wallet connected successfully!', 'success');

            await this.loadStats();

        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showMessage('Failed to connect wallet: ' + error.message, 'error');
        }
    }

    updateWalletUI(connected) {
        const statusElement = document.getElementById('walletStatus');
        const iconElement = document.getElementById('statusIcon');
        const textElement = document.getElementById('statusText');
        const connectButton = document.getElementById('connectWallet');

        if (connected) {
            statusElement.className = 'connection-status connected';
            iconElement.textContent = '✅';
            textElement.textContent = `Connected: ${this.userAddress?.slice(0, 6)}...${this.userAddress?.slice(-4)}`;
            connectButton.textContent = 'Connected';
            connectButton.disabled = true;
        } else {
            statusElement.className = 'connection-status disconnected';
            iconElement.textContent = '❌';
            textElement.textContent = 'Wallet Not Connected';
            connectButton.textContent = 'Connect Wallet';
            connectButton.disabled = false;
        }
    }

    async loadStats() {
        if (!this.contract) return;

        try {
            const stats = await this.contract.getCurrentStats();

            document.getElementById('currentSeason').textContent = stats.season.toString();
            document.getElementById('totalAthletes').textContent = stats.totalAthletes.toString();
            document.getElementById('activeTeams').textContent = stats.activeTeams.toString();
            document.getElementById('totalProposals').textContent = stats.totalProposals.toString();

        } catch (error) {
            console.error('Error loading stats:', error);
            this.showMessage('Failed to load contract stats', 'error');
        }
    }

    async registerTeam() {
        if (!this.contract) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        try {
            const teamName = document.getElementById('teamName').value;
            const league = document.getElementById('league').value;
            const teamManager = document.getElementById('teamManager').value;
            const salaryCap = document.getElementById('salaryCap').value;

            if (!teamName || !league || !teamManager || !salaryCap) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            if (!ethers.utils.isAddress(teamManager)) {
                this.showMessage('Invalid team manager address', 'error');
                return;
            }

            this.showMessage('Registering team... Please confirm transaction', 'info');

            const tx = await this.contract.registerTeam(
                teamName,
                league,
                teamManager,
                parseInt(salaryCap)
            );

            this.showMessage('Transaction submitted. Waiting for confirmation...', 'info');
            await tx.wait();

            this.showMessage(`Team "${teamName}" registered successfully!`, 'success');
            this.clearForm(['teamName', 'league', 'teamManager', 'salaryCap']);
            await this.loadStats();

        } catch (error) {
            console.error('Error registering team:', error);
            this.showMessage('Failed to register team: ' + error.message, 'error');
        }
    }

    async registerAthlete() {
        if (!this.contract) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        try {
            const name = document.getElementById('athleteName').value;
            const position = document.getElementById('position').value;
            const teamId = document.getElementById('athleteTeam').value;
            const athleteAddress = document.getElementById('athleteAddress').value;
            const salary = document.getElementById('salary').value;
            const bonus = document.getElementById('bonus').value;
            const duration = document.getElementById('contractDuration').value;

            if (!name || !position || !teamId || !athleteAddress || !salary || !bonus || !duration) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            if (!ethers.utils.isAddress(athleteAddress)) {
                this.showMessage('Invalid athlete address', 'error');
                return;
            }

            this.showMessage('Registering athlete... Please confirm transaction', 'info');

            const tx = await this.contract.registerAthlete(
                name,
                position,
                parseInt(teamId),
                athleteAddress,
                parseInt(salary),
                parseInt(bonus),
                parseInt(duration)
            );

            this.showMessage('Transaction submitted. Waiting for confirmation...', 'info');
            await tx.wait();

            this.showMessage(`Athlete "${name}" registered successfully!`, 'success');
            this.clearForm(['athleteName', 'position', 'athleteTeam', 'athleteAddress', 'salary', 'bonus', 'contractDuration']);
            await this.loadStats();

        } catch (error) {
            console.error('Error registering athlete:', error);
            this.showMessage('Failed to register athlete: ' + error.message, 'error');
        }
    }

    async proposeContract() {
        if (!this.contract) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        try {
            const athleteId = document.getElementById('proposalAthleteId').value;
            const teamId = document.getElementById('proposalTeamId').value;
            const salary = document.getElementById('proposedSalary').value;
            const bonus = document.getElementById('proposedBonus').value;
            const duration = document.getElementById('proposalDuration').value;

            if (!athleteId || !teamId || !salary || !bonus || !duration) {
                this.showMessage('Please fill in all fields', 'error');
                return;
            }

            this.showMessage('Proposing contract... Please confirm transaction', 'info');

            const tx = await this.contract.proposeContract(
                parseInt(athleteId),
                parseInt(teamId),
                parseInt(salary),
                parseInt(bonus),
                parseInt(duration)
            );

            this.showMessage('Transaction submitted. Waiting for confirmation...', 'info');
            await tx.wait();

            this.showMessage('Contract proposal submitted successfully!', 'success');
            this.clearForm(['proposalAthleteId', 'proposalTeamId', 'proposedSalary', 'proposedBonus', 'proposalDuration']);
            await this.loadStats();

        } catch (error) {
            console.error('Error proposing contract:', error);
            this.showMessage('Failed to propose contract: ' + error.message, 'error');
        }
    }

    async executeQuery() {
        if (!this.contract) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        const queryType = document.getElementById('queryType').value;
        const queryId = document.getElementById('queryId').value;
        const resultsDiv = document.getElementById('queryResults');

        if (!queryType) {
            this.showMessage('Please select a query type', 'error');
            return;
        }

        try {
            let result;
            let displayHTML = '';

            switch (queryType) {
                case 'athlete':
                    if (!queryId) {
                        this.showMessage('Please enter athlete ID', 'error');
                        return;
                    }
                    result = await this.contract.getAthleteInfo(parseInt(queryId));
                    displayHTML = `
                        <div class="data-item">
                            <h3>Athlete Information (ID: ${queryId})</h3>
                            <p><strong>Name:</strong> ${result.name}</p>
                            <p><strong>Position:</strong> ${result.position}</p>
                            <p><strong>Team ID:</strong> ${result.teamId.toString()}</p>
                            <p><strong>Active:</strong> ${result.isActive ? 'Yes' : 'No'}</p>
                            <p><strong>Contract Start:</strong> ${new Date(result.contractStart.toNumber() * 1000).toLocaleDateString()}</p>
                            <p><strong>Contract End:</strong> ${new Date(result.contractEnd.toNumber() * 1000).toLocaleDateString()}</p>
                            <p><strong>Address:</strong> ${result.athleteAddress}</p>
                        </div>
                    `;
                    break;

                case 'team':
                    if (!queryId) {
                        this.showMessage('Please enter team ID', 'error');
                        return;
                    }
                    result = await this.contract.getTeamInfo(parseInt(queryId));
                    displayHTML = `
                        <div class="data-item">
                            <h3>Team Information (ID: ${queryId})</h3>
                            <p><strong>Team Name:</strong> ${result.teamName}</p>
                            <p><strong>League:</strong> ${result.league}</p>
                            <p><strong>Manager:</strong> ${result.teamManager}</p>
                            <p><strong>Athletes Count:</strong> ${result.athleteIds.length}</p>
                            <p><strong>Active:</strong> ${result.isActive ? 'Yes' : 'No'}</p>
                            <p><strong>Athlete IDs:</strong> ${result.athleteIds.map(id => id.toString()).join(', ')}</p>
                        </div>
                    `;
                    break;

                case 'proposal':
                    if (!queryId) {
                        this.showMessage('Please enter proposal ID', 'error');
                        return;
                    }
                    result = await this.contract.getProposalInfo(parseInt(queryId));
                    displayHTML = `
                        <div class="data-item">
                            <h3>Proposal Information (ID: ${queryId})</h3>
                            <p><strong>Athlete ID:</strong> ${result.athleteId.toString()}</p>
                            <p><strong>Team ID:</strong> ${result.teamId.toString()}</p>
                            <p><strong>Contract Duration:</strong> ${result.contractDuration.toString()} months</p>
                            <p><strong>Status:</strong> ${result.isPending ? 'Pending' : (result.isApproved ? 'Approved' : 'Rejected')}</p>
                            <p><strong>Proposer:</strong> ${result.proposer}</p>
                            <p><strong>Timestamp:</strong> ${new Date(result.timestamp.toNumber() * 1000).toLocaleString()}</p>
                        </div>
                    `;
                    break;

                case 'stats':
                    result = await this.contract.getCurrentStats();
                    displayHTML = `
                        <div class="data-item">
                            <h3>Contract Statistics</h3>
                            <p><strong>Current Season:</strong> ${result.season.toString()}</p>
                            <p><strong>Total Athletes:</strong> ${result.totalAthletes.toString()}</p>
                            <p><strong>Active Teams:</strong> ${result.activeTeams.toString()}</p>
                            <p><strong>Total Proposals:</strong> ${result.totalProposals.toString()}</p>
                        </div>
                    `;
                    break;
            }

            resultsDiv.innerHTML = displayHTML;
            resultsDiv.classList.remove('hidden');

        } catch (error) {
            console.error('Error executing query:', error);
            this.showMessage('Query failed: ' + error.message, 'error');
            resultsDiv.classList.add('hidden');
        }
    }

    clearForm(fieldIds) {
        fieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
    }

    showMessage(message, type) {
        const messagesDiv = document.getElementById('statusMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message ${type}`;
        messageDiv.textContent = message;

        messagesDiv.appendChild(messageDiv);

        // Remove message after 5 seconds
        setTimeout(() => {
            if (messagesDiv.contains(messageDiv)) {
                messagesDiv.removeChild(messageDiv);
            }
        }, 5000);

        // Scroll to show the message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Initialize the DApp when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SportsContractDApp();
});

// Handle account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            location.reload();
        } else {
            location.reload();
        }
    });

    window.ethereum.on('chainChanged', (chainId) => {
        location.reload();
    });
}