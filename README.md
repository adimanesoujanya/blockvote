# BlockVote: A Secure and Transparent Electronic Voting System Using Blockchain Technology

🎓 **Final Year Computer Science & Engineering (CSE) Project**  
🔗 **Blockchain Network:** Ethereum / Ganache Local Testnet  
🦊 **Authentication:** MetaMask Web3 Wallet  
📜 **Smart Contracts:** Solidity (`^0.8.20`)  
💻 **Frontend:** Semantic HTML5, CSS3 (Navy Blue & Teal Theme), Vanilla JavaScript (ES6+), Ethers.js v6  

---

## 📌 Project Architecture Overview

Traditional electronic voting machines (EVMs) and centralized databases are vulnerable to single-point-of-failure attacks, unauthorized ledger alterations, and lack transparent auditability.

**BlockVote** solves these vulnerabilities by decentralizing the election process:
1. **Decentralized Ledger (Immutability):** Every vote is committed to a block with cryptographic hashes (`keccak256`). Once mined, no administrator or malicious actor can modify or delete a ballot.
2. **Deterministic Smart Contract Execution:** Election rules, candidate lists, and vote counters are enforced by [contracts/Voting.sol](file:///c:/Users/Admin/OneDrive/Desktop/final%20project/contracts/Voting.sol).
3. **Double-Voting Prevention:** The contract uses a persistent state mapping `mapping(address => Voter) public voters`. If a voter attempts to vote twice, the EVM immediately reverts the transaction with `"BlockVote: Address has already cast a ballot"`.
4. **Public Verifiability:** Voters receive a cryptographic transaction hash, block number, and gas receipt to independently verify their vote on the ledger.

---

## 📂 Project Directory Structure

```text
final project/
├── contracts/
│   └── Voting.sol          # Solidity Smart Contract (Core voting logic & state)
├── scripts/
│   └── deploy.js           # Automated Ganache deployment script
├── public/
│   ├── index.html          # Web3 responsive voting portal & live dashboard
│   ├── style.css           # Navy blue, white & teal theme
│   ├── script.js           # Ethers.js Web3 integration, MetaMask event handling
│   └── contract-config.js  # Deployed contract address & generated ABI
├── package.json            # Node.js project configuration
└── README.md               # Project documentation & viva defense guide
```

---

## 🚀 Step-by-Step Execution Guide

### Step 1: Start Ganache GUI (Local Blockchain)
1. Launch the **Ganache GUI** application on your computer.
2. Click **"Quickstart Ethereum"**.
3. Verify the default server configuration:
   * **RPC Server:** `HTTP://127.0.0.1:7545`
   * **Network ID / Chain ID:** `5777` (or `1337`)
   * Ganache provides **10 test accounts**, each pre-funded with **100.00 ETH**.

---

### Step 2: Configure MetaMask for Ganache
1. Open your browser and click the **MetaMask** extension icon.
2. Click the Network dropdown in the top-left corner and select **"Add network"** ➡️ **"Add a network manually"**.
3. Fill in the network details:
   * **Network Name:** `Ganache Local`
   * **New RPC URL:** `http://127.0.0.1:7545`
   * **Chain ID:** `5777` (if MetaMask suggests `1337`, enter `1337`)
   * **Currency Symbol:** `ETH`
4. Click **Save** and switch to `Ganache Local`.
5. **Import a Test Account:**
   * In Ganache GUI, click the **key icon** on the right side of the first test account (Account 0).
   * Copy the **Private Key** (64 hexadecimal characters).
   * In MetaMask, click the account icon in the top center ➡️ **"Add account or hardware wallet"** ➡️ **"Import account"**.
   * Paste the private key and click **Import**.
   * You will immediately see a balance of **100 ETH**!

---

### Step 3: Deploy `Voting.sol` to Ganache

You can choose either of two easy deployment methods:

#### Method A: Instant 30-Second Deployment via Remix IDE (Recommended for College Lab Viva)
1. Open your browser and navigate to: [https://remix.ethereum.org](https://remix.ethereum.org)
2. In the File Explorer tab, under `contracts`, create a new file named `Voting.sol`.
3. Copy the entire code from [`contracts/Voting.sol`](file:///c:/Users/Admin/OneDrive/Desktop/final%20project/contracts/Voting.sol) and paste it into Remix.
4. Click on the **Solidity Compiler** icon on the left:
   * Select Compiler Version: `0.8.20`
   * Click **Compile Voting.sol** (verify the green checkmark).
5. Click on the **Deploy & Run Transactions** icon on the left:
   * In the **ENVIRONMENT** dropdown, select: **"Injected Provider - MetaMask"**.
   * MetaMask will prompt you to connect; select your Ganache test account.
   * Under the orange **Deploy** button, enter constructor parameters:
     * `_title`: `"University General Election 2026"`
     * `_names`: `["Dr. Evelyn Reed", "Marcus Vance", "Sophia Chen"]`
     * `_roles`: `["Digital Rights", "Decentralized Infra", "AI Ethics"]`
     * `_manifestos`: `["Transparency agenda", "Ledger infrastructure", "Algorithmic ethics"]`
   * Click **transact / Deploy**.
   * Confirm the transaction popup in MetaMask!
6. Copy the **Deployed Contract Address** (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`).
7. Open [`public/contract-config.js`](file:///c:/Users/Admin/OneDrive/Desktop/final%20project/public/contract-config.js) and update:
   ```javascript
   CONTRACT_ADDRESS: "PASTE_YOUR_DEPLOYED_ADDRESS_HERE",
   ```

#### Method B: Automated Deployment via Terminal
If you have `ethers` and `solc` installed, open PowerShell and run:
```powershell
node scripts/deploy.js
```
The script compiles the contract, deploys it to Ganache, and automatically updates `public/contract-config.js`!

---

### Step 4: Run & Preview the Portal
Open PowerShell and start a local HTTP server:
```powershell
cd "c:\Users\Admin\OneDrive\Desktop\final project"
python -m http.server 3000 --directory public
```
Visit `http://localhost:3000` in your web browser.

---

## 🧪 Demonstration & Testing Workflow

1. **Connect Wallet:** Click the **"Connect MetaMask"** button in the header. MetaMask prompts for connection; once accepted, your wallet address and 100 ETH balance appear with a bright green status indicator.
2. **Cast Ballot:** Click **"Vote for Dr. Evelyn"**. MetaMask opens a popup asking you to sign and broadcast the transaction with gas fees. Click **Confirm**.
3. **Inspect Block Confirmation:**
   * Watch the button switch to `Mining Ballot...`.
   * Once confirmed, a green banner appears: `✓ Ballot successfully mined on block #1!`.
   * An on-chain **Blockchain Transaction Receipt** card displays:
     * Voter Address: `0x...`
     * Candidate Chosen: `Dr. Evelyn Reed`
     * Block Number: `#1`
     * Gas Consumed: `~78,000 units`
     * Transaction Hash: `0x...`
   * In **Ganache GUI**, check the **Blocks** and **Transactions** tabs to show the examiner the newly mined block and gas consumption!
4. **Test Double-Voting Prevention (Crucial for Viva):**
   * Try clicking the vote button again with the same account.
   * Notice that the button is disabled and marked `✓ Ballot Cast (Mined)`.
   * Even if a user attempts to call the smart contract directly, the Solidity require statement rejects it:
     ```solidity
     require(!voters[msg.sender].hasVoted, "BlockVote: Address has already cast a ballot");
     ```
   * The UI displays: `"Decentralized Double-Voting Blocked: The smart contract rejected this ballot because address has already voted."`
5. **Multi-Voter Demonstration:**
   * In MetaMask, switch to **Account 2** (imported from Ganache Account 1).
   * Notice the page instantly updates! The vote button unlocks because Account 2 is eligible to vote.
   * Cast a vote for Marcus Vance and watch the live progress bars update in real time!

---

## 🎓 Viva Questions & Answers (Final Year CSE Defense)

#### Q1: Why use Ethereum blockchain instead of a conventional SQL database?
> **Answer:** Conventional databases (MySQL, PostgreSQL) have a centralized Database Administrator (DBA) who possesses full root permissions to edit, truncate, or inject records without leaving a tamper-proof trace. Blockchain uses cryptographic hashing (`SHA-256` / `Keccak-256`) and consensus algorithms where every block links to the previous block's hash. Modifying any historical vote would invalidate all subsequent block hashes, making vote manipulation mathematically impossible.

#### Q2: How is double-voting prevented on-chain?
> **Answer:** In `Voting.sol`, each voter address is mapped to a `Voter` struct in permanent storage (`mapping(address => Voter) public voters;`). During the execution of `vote(uint256 candidateId)`, the contract first checks `require(!voters[msg.sender].hasVoted)`. If `hasVoted` is true, the EVM immediately reverts the transaction, consumes minimal gas, and aborts state changes.

#### Q3: What is the role of Ganache in this project?
> **Answer:** Ganache is a local private Ethereum blockchain simulator. It allows developers to test smart contracts, inspect mined blocks, analyze gas consumption, and execute transactions deterministically without spending real money on public Ethereum mainnet gas fees.

#### Q4: What is the role of MetaMask?
> **Answer:** MetaMask serves as the Ethereum Web3 provider and cryptographic signer (`window.ethereum`). It securely holds the voter's private key, authenticates transactions through digital signatures (`ECDSA`), and communicates with the blockchain RPC node without exposing private keys to the web application.

#### Q5: What future enhancements are needed for a national-scale election?
> **Answer:** 
> 1. **Zero-Knowledge Proofs (ZKP / zk-SNARKs):** To guarantee complete ballot secrecy (so the public can verify the tally is correct without seeing who voted for whom).
> 2. **Decentralized Identity (DID / Aadhaar integration):** To verify civic voter eligibility off-chain while granting an anonymous voting voucher token on-chain.
