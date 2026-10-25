/**
 * BlockVote - Smart Contract Configuration
 * 
 * After deploying Voting.sol to your local Ganache blockchain,
 * paste the deployed contract address below into CONTRACT_ADDRESS.
 * 
 * Default Ganache GUI Settings:
 * RPC Server: http://127.0.0.1:7545
 * Network ID / Chain ID: 5777 (or 1337)
 */

const BLOCKVOTE_CONFIG = {
  // Replace this address with your deployed Voting contract address from Ganache
  CONTRACT_ADDRESS: "0xf3F3dC47a80842C0503b72CC94649927C2D2CDe7",

  // Local Ganache Network Parameters for MetaMask switching
  NETWORK: {
    chainIdHex: "0x539", // 1337 in hex (or 5777 = 0x1691)
    chainIdDecimal: 1337,
    chainName: "Ganache Local",
    rpcUrls: ["http://127.0.0.1:7545"],
    currencySymbol: "ETH"
  },

  // Standard ABI generated from contracts/Voting.sol
  CONTRACT_ABI: [
    {
      "inputs": [
        { "internalType": "string", "name": "_title", "type": "string" },
        { "internalType": "string[]", "name": "_names", "type": "string[]" },
        { "internalType": "string[]", "name": "_roles", "type": "string[]" },
        { "internalType": "string[]", "name": "_manifestos", "type": "string[]" }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
        { "indexed": true, "internalType": "uint256", "name": "candidateId", "type": "uint256" },
        { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ],
      "name": "BallotCast",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "uint256", "name": "candidateId", "type": "uint256" },
        { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
        { "indexed": false, "internalType": "string", "name": "role", "type": "string" }
      ],
      "name": "CandidateRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "bool", "name": "isActive", "type": "bool" },
        { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ],
      "name": "ElectionStatusChanged",
      "type": "event"
    },
    {
      "inputs": [
        { "internalType": "string", "name": "_name", "type": "string" },
        { "internalType": "string", "name": "_role", "type": "string" },
        { "internalType": "string", "name": "_manifesto", "type": "string" }
      ],
      "name": "addCandidate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "", "type": "uint256" }
      ],
      "name": "candidates",
      "outputs": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "string", "role", "type": "string" },
        { "internalType": "string", "manifesto", "type": "string" },
        { "internalType": "uint256", "voteCount", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "candidatesCount",
      "outputs": [
        { "internalType": "uint256", "name": "", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "electionActive",
      "outputs": [
        { "internalType": "bool", "name": "", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "electionCommissioner",
      "outputs": [
        { "internalType": "address", "name": "", "type": "address" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "electionTitle",
      "outputs": [
        { "internalType": "string", "name": "", "type": "string" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllCandidates",
      "outputs": [
        {
          "components": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "role", "type": "string" },
            { "internalType": "string", "name": "manifesto", "type": "string" },
            { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
          ],
          "internalType": "struct Voting.Candidate[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getLeader",
      "outputs": [
        { "internalType": "uint256", "name": "leaderId", "type": "uint256" },
        { "internalType": "string", "name": "leaderName", "type": "string" },
        { "internalType": "uint256", "name": "maxVotes", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getStats",
      "outputs": [
        { "internalType": "string", "name": "title", "type": "string" },
        { "internalType": "bool", "name": "active", "type": "bool" },
        { "internalType": "uint256", "name": "candidateCount", "type": "uint256" },
        { "internalType": "uint256", "name": "totalVotesCast", "type": "uint256" },
        { "internalType": "address", "name": "commissioner", "type": "address" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "_voter", "type": "address" }
      ],
      "name": "getVoterReceipt",
      "outputs": [
        { "internalType": "bool", "name": "voted", "type": "bool" },
        { "internalType": "uint256", "name": "candidateId", "type": "uint256" },
        { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "_voter", "type": "address" }
      ],
      "name": "hasAddressVoted",
      "outputs": [
        { "internalType": "bool", "name": "", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "bool", "name": "_active", "type": "bool" }
      ],
      "name": "setElectionStatus",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalVotes",
      "outputs": [
        { "internalType": "uint256", "name": "", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "", "type": "address" }
      ],
      "name": "voters",
      "outputs": [
        { "internalType": "bool", "name": "hasVoted", "type": "bool" },
        { "internalType": "uint256", "name": "votedCandidateId", "type": "uint256" },
        { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "uint256", "name": "_candidateId", "type": "uint256" }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};

// Export for browser window
if (typeof window !== "undefined") {
  window.BLOCKVOTE_CONFIG = BLOCKVOTE_CONFIG;
}
