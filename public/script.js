/* =========================================================
   BlockVote - Frontend JavaScript (Web3 & MetaMask Integration)
   Project: A Secure and Transparent Electronic Voting System
            Using Blockchain Technology (Final Year CSE Demo)

   ARCHITECTURE OVERVIEW:
   - Web3 Provider: MetaMask (window.ethereum) via Ethers.js v6
   - Local Blockchain: Ganache GUI (HTTP://127.0.0.1:7545)
   - Smart Contract: contracts/Voting.sol
   - Graceful Fallback: Interactive demo simulation if MetaMask
     is not yet connected or contract is awaiting deployment.
   ========================================================= */

"use strict";

/* ---------- 1. Seed Candidates (Default Demo / Fallback Data) ---------- */
const DEFAULT_CANDIDATES = [
  {
    id: 1,
    number: 1,
    name: "Dr. Evelyn Reed",
    role: "Digital Rights & Open Data",
    description: "Focusing on cryptographic transparency in public systems, algorithmic accountability, and digital voting rights.",
    votes: 0
  },
  {
    id: 2,
    number: 2,
    name: "Marcus Vance",
    role: "Decentralized Infrastructure",
    description: "Championing decentralized identity protocols, green energy blockchain networks, and tamper-resistant civic ledgers.",
    votes: 0
  },
  {
    id: 3,
    number: 3,
    name: "Sophia Chen",
    role: "AI Ethics & Public Policy",
    description: "Advocating for ethical AI deployment, privacy-preserving governance frameworks, and accessible civic participation.",
    votes: 0
  }
];

/* ---------- Cloud Real-Time Global Tally (Syncs 50+ Classmates Phones) ---------- */
const CLOUD_SYNC = {
  enabled: true,
  baseUrl: "https://countapi.mileshilliard.com/api/v1",
  keys: {
    1: "blockvote_2026_soujanya_c1",
    2: "blockvote_2026_soujanya_c2",
    3: "blockvote_2026_soujanya_c3"
  }
};

// Fetch real-time shared counts from cloud across all classmate devices
async function fetchCloudVotes() {
  if (!CLOUD_SYNC.enabled || state.mode === "web3") return;
  try {
    const promises = [1, 2, 3].map(function (id) {
      const key = CLOUD_SYNC.keys[id];
      return fetch(CLOUD_SYNC.baseUrl + "/get/" + key, { cache: "no-store" })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          return { id: id, count: data && typeof data.value === "number" ? data.value : 0 };
        })
        .catch(function () { return { id: id, count: 0 }; });
    });

    const results = await Promise.all(promises);
    let updated = false;
    results.forEach(function (res) {
      const cand = state.candidates.find(function (c) { return c.id === res.id; });
      if (cand && cand.votes !== res.count) {
        cand.votes = res.count;
        updated = true;
      }
    });

    if (updated) {
      renderStatistics();
      renderResults();
    }
  } catch (e) {
    console.log("Cloud sync check:", e);
  }
}

// Increment live cloud tally when classmate votes
async function incrementCloudVote(candidateId) {
  const key = CLOUD_SYNC.keys[candidateId];
  if (!key) return;
  try {
    const res = await fetch(CLOUD_SYNC.baseUrl + "/hit/" + key, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const cand = state.candidates.find(function (c) { return c.id === candidateId; });
      if (cand && typeof data.value === "number") {
        cand.votes = data.value;
      }
    }
  } catch (err) {
    console.log("Cloud hit error:", err);
  }
}

/* ---------- 2. Application State ---------- */
const state = {
  // Web3 Connection
  provider: null,
  signer: null,
  contract: null,
  userAddress: null,
  userBalance: null,
  chainId: null,
  isContractConnected: false,
  isMining: false,

  // Election State
  electionTitle: "BlockVote Electronic Voting",
  electionActive: true,
  candidates: DEFAULT_CANDIDATES.map(function (c) {
    return Object.assign({}, c);
  }),
  hasVoted: false,
  votedCandidateId: null,

  // Mode: "web3" or "demo"
  mode: "demo"
};

/* ---------- 3. DOM Element Selectors ---------- */
const el = {
  navToggle: document.getElementById("navToggle"),
  mainNav: document.getElementById("mainNav"),
  walletBtn: document.getElementById("walletBtn"),
  walletDot: document.getElementById("walletDot"),
  walletBtnLabel: document.getElementById("walletBtnLabel"),
  walletStatus: document.getElementById("walletStatus"),
  walletStatusText: document.getElementById("walletStatusText"),
  sourceBadge: document.getElementById("sourceBadge"),
  votingModeBadge: document.getElementById("votingModeBadge"),
  votingSubtitle: document.getElementById("votingSubtitle"),
  statStatus: document.getElementById("statStatus"),
  statStatusNote: document.getElementById("statStatusNote"),
  statCandidates: document.getElementById("statCandidates"),
  statVotes: document.getElementById("statVotes"),
  statVotesNote: document.getElementById("statVotesNote"),
  statLeader: document.getElementById("statLeader"),
  candidateGrid: document.getElementById("candidateGrid"),
  voteMessage: document.getElementById("voteMessage"),
  resetDemoBtn: document.getElementById("resetDemoBtn"),
  resultsTotal: document.getElementById("resultsTotal"),
  resultsList: document.getElementById("resultsList"),
  txReceiptContainer: document.getElementById("txReceiptContainer"),
  receiptVoter: document.getElementById("receiptVoter"),
  receiptCandidate: document.getElementById("receiptCandidate"),
  receiptBlock: document.getElementById("receiptBlock"),
  receiptGas: document.getElementById("receiptGas"),
  receiptTxHash: document.getElementById("receiptTxHash")
};

/* ---------- 4. Helper Utility Functions ---------- */

// Shorten Ethereum address (e.g. 0x71C...49b2)
function formatAddress(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Calculate total sum of votes
function calculateTotalVotes() {
  return state.candidates.reduce(function (accumulator, current) {
    return accumulator + Number(current.votes || 0);
  }, 0);
}

// Extract initials for candidate avatar
function extractInitials(name) {
  const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, "").trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Find candidate with maximum votes
function getLeadingCandidate() {
  if (state.candidates.length === 0) return null;
  return state.candidates.reduce(function (leader, current) {
    return (Number(current.votes) > Number(leader.votes)) ? current : leader;
  }, state.candidates[0]);
}

// Display user notification banner
function displayFeedback(text, type) {
  if (!el.voteMessage) return;
  el.voteMessage.textContent = text;
  el.voteMessage.className = "message " + type; // success, error, info
  el.voteMessage.hidden = false;
}

// Hide user notification banner
function clearFeedback() {
  if (!el.voteMessage) return;
  el.voteMessage.textContent = "";
  el.voteMessage.className = "message";
  el.voteMessage.hidden = true;
}

/* ---------- 5. Render Functions ---------- */

function renderHeaderWallet() {
  if (!el.walletBtnLabel || !el.walletDot) return;

  if (state.mode === "web3" && state.userAddress) {
    el.walletDot.className = "wallet-dot connected";
    el.walletBtn.className = "btn btn-wallet connected";
    const balanceStr = state.userBalance ? " (" + Number(state.userBalance).toFixed(2) + " ETH)" : "";
    el.walletBtnLabel.textContent = formatAddress(state.userAddress) + balanceStr;

    if (el.walletStatus) {
      el.walletStatus.className = "wallet-status-bar connected";
    }

    const netName = (state.chainId === 5777 || state.chainId === 1337)
      ? "Ganache Local (" + state.chainId + ")"
      : "Chain ID: " + state.chainId;

    const singleVoteBadge = state.hasVoted
      ? '<span class="wallet-chip" style="color: #065f46;">&#9989; Ballot Confirmed</span>'
      : '<span class="wallet-chip" style="color: #0f766e;">&#9997;&#65039; Eligible to Vote</span>';

    const contractInfo = state.isContractConnected
      ? '<span class="wallet-chip">Contract: ' + formatAddress(window.BLOCKVOTE_CONFIG.CONTRACT_ADDRESS) + '</span>'
      : '<span class="wallet-chip" style="color:#b45309;">Contract Pending Deployment</span>';

    if (el.walletStatusText) {
      el.walletStatusText.innerHTML =
        '<div class="wallet-status-inner">' +
          '<span>Connected: <strong>' + formatAddress(state.userAddress) + '</strong></span> &bull; ' +
          '<span class="wallet-chip">Network: ' + netName + '</span>' +
          contractInfo +
          singleVoteBadge +
        '</div>';
    }

    if (el.sourceBadge) {
      el.sourceBadge.textContent = state.isContractConnected ? "Ganache On-Chain" : "Web3 Connected (Demo Data)";
      el.sourceBadge.className = "badge badge-live";
    }

    if (el.votingModeBadge) {
      el.votingModeBadge.textContent = state.isContractConnected ? "Solidity Contract Active" : "Web3 Mode Active";
      el.votingModeBadge.className = "badge badge-live";
    }
  } else {
    el.walletDot.className = "wallet-dot";
    el.walletBtn.className = "btn btn-wallet";
    el.walletBtnLabel.textContent = "Connect MetaMask";

    if (el.walletStatus) {
      el.walletStatus.className = "wallet-status-bar";
    }
    if (el.walletStatusText) {
      el.walletStatusText.innerHTML =
        'MetaMask Wallet: <strong>Not Connected</strong> &bull; ' +
        'Click "Connect MetaMask" to authenticate with your Ganache test account.';
    }

    if (el.sourceBadge) {
      el.sourceBadge.textContent = "Demo Mode (In-Memory)";
      el.sourceBadge.className = "badge";
    }

    if (el.votingModeBadge) {
      el.votingModeBadge.textContent = "Demo Simulation";
      el.votingModeBadge.className = "badge badge-warn";
    }
  }
}

// Render Election Statistics Overview
function renderStatistics() {
  const totalVotes = calculateTotalVotes();
  const leader = getLeadingCandidate();

  if (el.statStatus) {
    if (!state.electionActive) {
      el.statStatus.textContent = "Closed";
      if (el.statStatusNote) el.statStatusNote.textContent = "Election Ended";
    } else if (state.hasVoted) {
      el.statStatus.textContent = "Voted";
      if (el.statStatusNote) el.statStatusNote.textContent = "Single Ballot Recorded";
    } else {
      el.statStatus.textContent = "Open";
      if (el.statStatusNote) el.statStatusNote.textContent = "Active Session";
    }
  }

  if (el.statCandidates) {
    el.statCandidates.textContent = state.candidates.length;
  }
  if (el.statVotes) {
    el.statVotes.textContent = totalVotes;
    if (el.statVotesNote) {
      el.statVotesNote.textContent = state.isContractConnected ? "Verified on Blockchain" : "Simulated Ballots";
    }
  }
  if (el.statLeader) {
    el.statLeader.textContent = (leader && Number(leader.votes) > 0) ? leader.name : "Evaluating...";
  }
}

// Render Candidate Cards Grid
function renderCandidates() {
  if (!el.candidateGrid) return;
  el.candidateGrid.innerHTML = "";

  state.candidates.forEach(function (candidate) {
    const isSelected = state.votedCandidateId === candidate.id;

    // Card Container
    const card = document.createElement("article");
    card.className = "candidate-card" + (isSelected ? " selected" : "");

    // Avatar
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = extractInitials(candidate.name);

    // Number Badge
    const numberBadge = document.createElement("p");
    numberBadge.className = "candidate-number";
    numberBadge.textContent = "Candidate #" + candidate.number;

    // Candidate Name
    const nameHeading = document.createElement("h3");
    nameHeading.className = "candidate-name";
    nameHeading.textContent = candidate.name;

    // Agenda / Role
    const roleText = document.createElement("p");
    roleText.className = "candidate-role";
    roleText.textContent = candidate.role;

    // Description / Manifesto
    const descText = document.createElement("p");
    descText.className = "candidate-desc";
    descText.textContent = candidate.description;

    // Vote Button
    const voteButton = document.createElement("button");
    voteButton.type = "button";
    voteButton.className = "btn btn-vote";
    voteButton.dataset.candidateId = String(candidate.id);

    if (state.isMining && state.votedCandidateId === candidate.id) {
      voteButton.innerHTML = '<span class="inline-spinner"></span> Mining Ballot...';
      voteButton.disabled = true;
    } else if (isSelected) {
      voteButton.textContent = state.isContractConnected ? "✓ Ballot Cast (Mined)" : "✓ Ballot Cast (Demo)";
      voteButton.disabled = true;
    } else if (state.hasVoted) {
      voteButton.textContent = "Vote Recorded";
      voteButton.disabled = true;
    } else if (!state.electionActive) {
      voteButton.textContent = "Election Closed";
      voteButton.disabled = true;
    } else {
      const firstName = candidate.name.split(" ")[0];
      voteButton.textContent = "Vote for " + firstName;
      voteButton.setAttribute("aria-label", "Vote for " + candidate.name);
    }

    card.append(avatar, numberBadge, nameHeading, roleText, descText, voteButton);
    el.candidateGrid.appendChild(card);
  });
}

// Render Results Dashboard with Animated Progress Bars
function renderResults() {
  const totalVotes = calculateTotalVotes();
  if (el.resultsTotal) {
    el.resultsTotal.textContent = totalVotes;
  }
  if (!el.resultsList) return;

  el.resultsList.innerHTML = "";
  const leader = getLeadingCandidate();

  state.candidates.forEach(function (candidate) {
    const votesCount = Number(candidate.votes || 0);
    const percentage = totalVotes === 0 ? 0 : (votesCount / totalVotes) * 100;
    const isLeader = leader && (votesCount === Number(leader.votes)) && (votesCount > 0);

    const row = document.createElement("li");
    row.className = "result-row";

    // Row Header (Name + Lead Badge + Meta Tally)
    const rowHead = document.createElement("div");
    rowHead.className = "result-head";

    const candidateInfo = document.createElement("div");
    candidateInfo.className = "result-candidate-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "result-name";
    nameSpan.textContent = candidate.name;
    candidateInfo.appendChild(nameSpan);

    if (isLeader) {
      const leadBadge = document.createElement("span");
      leadBadge.className = "badge-lead";
      leadBadge.textContent = "★ Leading";
      candidateInfo.appendChild(leadBadge);
    }

    const metaSpan = document.createElement("span");
    metaSpan.className = "result-meta";
    metaSpan.textContent = votesCount + " votes (" + percentage.toFixed(1) + "%)";

    rowHead.append(candidateInfo, metaSpan);

    // Progress Bar Track & Fill
    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", candidate.name + " vote percentage");
    track.setAttribute("aria-valuenow", percentage.toFixed(1));
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    setTimeout(function () {
      fill.style.width = percentage + "%";
    }, 40);

    track.appendChild(fill);
    row.append(rowHead, track);
    el.resultsList.appendChild(row);
  });
}

// Display On-Chain Transaction Receipt Card
function showReceipt(voter, candidateName, blockNum, gasUsed, txHash) {
  if (!el.txReceiptContainer) return;
  if (el.receiptVoter) el.receiptVoter.textContent = voter;
  if (el.receiptCandidate) el.receiptCandidate.textContent = candidateName;
  if (el.receiptBlock) el.receiptBlock.textContent = "#" + blockNum;
  if (el.receiptGas) el.receiptGas.textContent = Number(gasUsed).toLocaleString() + " units";
  if (el.receiptTxHash) el.receiptTxHash.textContent = txHash;
  el.txReceiptContainer.style.display = "block";
}

// Master Render
function renderAll() {
  renderHeaderWallet();
  renderStatistics();
  renderCandidates();
  renderResults();
}

/* ---------- 6. Web3 & Smart Contract Interaction ---------- */

// Check and request Ganache network switch in MetaMask
async function ensureGanacheNetwork() {
  if (!window.ethereum || !window.BLOCKVOTE_CONFIG) return;

  const currentChainIdHex = await window.ethereum.request({ method: "eth_chainId" });

  // If already on 1337 (0x539) or 5777 (0x1691), we are already on Ganache!
  if (currentChainIdHex === "0x539" || currentChainIdHex === "0x1691") {
    return;
  }

  // Try switching to 1337 first, then 5777
  const targetChainIdHex = window.BLOCKVOTE_CONFIG.NETWORK.chainIdHex || "0x539";
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainIdHex }]
    });
  } catch (switchError) {
    // If not found, try 0x1691 (5777)
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1691" }]
      });
    } catch (e2) {
      console.warn("Could not switch chain automatically:", e2);
    }
  }
}

// Connect MetaMask Wallet
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    displayFeedback("MetaMask not detected. Please install the MetaMask browser extension to use Web3 mode.", "error");
    return;
  }

  try {
    displayFeedback("Requesting account access from MetaMask...", "info");

    // Initialize Ethers provider from window.ethereum
    state.provider = new ethers.BrowserProvider(window.ethereum);

    // Request user accounts
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      displayFeedback("No accounts found. Please unlock MetaMask.", "error");
      return;
    }

    // Check and switch to Ganache network first
    await ensureGanacheNetwork();

    // Re-read provider & network after switch
    state.provider = new ethers.BrowserProvider(window.ethereum);
    state.signer = await state.provider.getSigner();
    state.userAddress = await state.signer.getAddress();

    const balanceWei = await state.provider.getBalance(state.userAddress);
    state.userBalance = ethers.formatEther(balanceWei);

    const network = await state.provider.getNetwork();
    state.chainId = Number(network.chainId);

    state.mode = "web3";
    clearFeedback();

    // Initialize Smart Contract
    await initSmartContract();

    renderAll();
  } catch (err) {
    console.error("MetaMask connection failed:", err);
    displayFeedback("Connection rejected: " + (err.message || err), "error");
  }
}

// Initialize Contract Connection
async function initSmartContract() {
  if (!state.signer || !window.BLOCKVOTE_CONFIG) return;

  const contractAddress = window.BLOCKVOTE_CONFIG.CONTRACT_ADDRESS;
  const contractAbi = window.BLOCKVOTE_CONFIG.CONTRACT_ABI;

  try {
    // Check if contract code exists at target address
    const code = await state.provider.getCode(contractAddress);
    if (!code || code === "0x" || code === "0x0") {
      console.warn("No smart contract bytecode deployed at " + contractAddress);
      state.isContractConnected = false;
      displayFeedback(
        "Notice: Smart Contract bytecode not found at " + formatAddress(contractAddress) +
        ". Make sure Ganache is running and Voting.sol is deployed (see README for deploy guide). Demo mode active.",
        "info"
      );
      if (el.resetDemoBtn) el.resetDemoBtn.style.display = "inline-flex";
      return;
    }

    state.contract = new ethers.Contract(contractAddress, contractAbi, state.signer);
    state.isContractConnected = true;

    // 1. Fetch on-chain candidates
    await loadContractData();

    // 2. Check if the connected address has already voted on-chain
    const alreadyVoted = await state.contract.hasAddressVoted(state.userAddress);
    state.hasVoted = alreadyVoted;

    if (alreadyVoted) {
      const receiptData = await state.contract.getVoterReceipt(state.userAddress);
      state.votedCandidateId = Number(receiptData[1]);
      displayFeedback("Verified: Address " + formatAddress(state.userAddress) + " has already cast a ballot in this election.", "info");
    } else {
      displayFeedback("Connected to BlockVote smart contract on Ganache! Ready to cast your ballot.", "success");
    }

    // 3. Listen for real-time on-chain events
    state.contract.removeAllListeners();
    state.contract.on("BallotCast", function (voter, candidateId, timestamp) {
      console.log("On-Chain BallotCast Event Received:", voter, candidateId, timestamp);
      loadContractData();
      if (voter.toLowerCase() === state.userAddress.toLowerCase()) {
        state.hasVoted = true;
        state.votedCandidateId = Number(candidateId);
      }
      renderAll();
    });

  } catch (err) {
    console.warn("Could not bind smart contract:", err);
    state.isContractConnected = false;
  }
}

// Load candidate list and statistics from the contract
async function loadContractData() {
  if (!state.contract || !state.isContractConnected) return;

  try {
    const rawCandidates = await state.contract.getAllCandidates();
    if (rawCandidates && rawCandidates.length > 0) {
      state.candidates = rawCandidates.map(function (c, idx) {
        return {
          id: Number(c.id),
          number: idx + 1,
          name: c.name,
          role: c.role,
          description: c.manifesto,
          votes: Number(c.voteCount)
        };
      });
    }

    const stats = await state.contract.getStats();
    state.electionTitle = stats[0];
    state.electionActive = stats[1];

    renderAll();
  } catch (err) {
    console.error("Error reading contract data:", err);
  }
}

/* ---------- 7. Voting Execution ---------- */

async function castVote(candidateId) {
  // 1. Check double voting
  if (state.hasVoted) {
    displayFeedback("Double-voting blocked: Your address has already cast a ballot.", "error");
    return;
  }

  // 2. If in Web3 Mode and contract is connected: send real Ethereum transaction
  if (state.mode === "web3" && state.isContractConnected && state.contract) {
    try {
      state.isMining = true;
      state.votedCandidateId = candidateId;
      renderCandidates();

      displayFeedback("MetaMask popup opened: Please sign and confirm the transaction with gas fees...", "info");

      // Trigger Solidity function: vote(candidateId)
      const tx = await state.contract.vote(candidateId);

      if (el.walletDot) el.walletDot.className = "wallet-dot pending";
      displayFeedback("Transaction submitted! Mining block on Ganache... Tx: " + tx.hash, "info");

      // Wait for transaction to be mined into a block
      const receipt = await tx.wait();

      state.isMining = false;
      state.hasVoted = true;

      const candidateObj = state.candidates.find(function (c) { return c.id === candidateId; });
      const candidateName = candidateObj ? candidateObj.name : "Candidate #" + candidateId;

      displayFeedback(
        "✓ Ballot successfully mined on block #" + receipt.blockNumber + "! Your vote is cryptographically sealed.",
        "success"
      );

      // Display Blockchain Receipt
      showReceipt(
        state.userAddress,
        candidateName,
        receipt.blockNumber,
        receipt.gasUsed.toString(),
        receipt.hash
      );

      // Reload fresh counts from contract
      await loadContractData();
      renderAll();

    } catch (err) {
      state.isMining = false;
      console.error("Vote transaction failed:", err);

      // Check if reverted by Solidity require statement
      const errString = (err.message || "").toLowerCase();
      if (errString.includes("already cast") || errString.includes("revert")) {
        displayFeedback(
          "Decentralized Double-Voting Blocked: The smart contract rejected this ballot because address " +
          formatAddress(state.userAddress) + " has already voted on the immutable ledger.",
          "error"
        );
        state.hasVoted = true;
      } else if (err.code === "ACTION_REJECTED" || errString.includes("user rejected")) {
        displayFeedback("Transaction cancelled by user in MetaMask.", "info");
      } else {
        displayFeedback("Transaction error: " + (err.shortMessage || err.message || err), "error");
      }
      renderAll();
    }
    return;
  }

  // 3. Fallback: Demo Cloud-Synced Voting (when MetaMask is not connected or on mobile devices)
  // Check if voter already cast ballot on this device
  if (localStorage.getItem("blockvote_voted_soujanya")) {
    state.hasVoted = true;
    displayFeedback("Double-voting blocked: You have already cast your ballot in this election.", "error");
    renderCandidates();
    return;
  }

  const candidate = state.candidates.find(function (c) {
    return c.id === candidateId;
  });

  if (!candidate) {
    displayFeedback("Error: Selected candidate could not be found.", "error");
    return;
  }

  candidate.votes += 1;
  state.hasVoted = true;
  state.votedCandidateId = candidateId;
  localStorage.setItem("blockvote_voted_soujanya", String(candidateId));

  displayFeedback("✓ Recording your ballot in the live election tally...", "info");
  renderAll();

  // Increment live cloud tally so all 50 classmates see it instantly!
  await incrementCloudVote(candidateId);
  await fetchCloudVotes();

  displayFeedback(
    "✓ Ballot successfully recorded for " + candidate.name + "! Live election tally updated across all devices.",
    "success"
  );

  if (el.resetDemoBtn) {
    el.resetDemoBtn.style.display = "inline-flex";
  }

  renderAll();
}

// Reset Demo Session back to initial values
function resetDemoSession() {
  localStorage.removeItem("blockvote_voted_soujanya");
  state.candidates = DEFAULT_CANDIDATES.map(function (c) {
    return Object.assign({}, c);
  });
  state.votedCandidateId = null;
  state.hasVoted = false;
  state.mode = "demo";

  if (el.txReceiptContainer) {
    el.txReceiptContainer.style.display = "none";
  }

  clearFeedback();
  if (el.resetDemoBtn) {
    el.resetDemoBtn.style.display = "none";
  }

  displayFeedback("Demo session has been reset. Syncing live election tally...", "info");
  fetchCloudVotes();
  renderAll();
}

/* ---------- 8. Event Listeners ---------- */

// Delegate candidate card vote button clicks
if (el.candidateGrid) {
  el.candidateGrid.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-candidate-id]");
    if (!button || button.disabled) return;

    const candidateId = Number(button.dataset.candidateId);
    castVote(candidateId);
  });
}

// Reset demo button listener
if (el.resetDemoBtn) {
  el.resetDemoBtn.addEventListener("click", resetDemoSession);
}

// Connect MetaMask Button Handler
if (el.walletBtn) {
  el.walletBtn.addEventListener("click", function () {
    connectWallet();
  });
}

// Mobile Hamburger Navigation Toggle
if (el.navToggle && el.mainNav) {
  el.navToggle.addEventListener("click", function () {
    const isOpen = el.mainNav.classList.toggle("open");
    el.navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Close mobile navigation on Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && el.mainNav && el.mainNav.classList.contains("open")) {
    el.mainNav.classList.remove("open");
    el.navToggle.setAttribute("aria-expanded", "false");
  }
});

// Smooth scroll handling for all in-page links
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener("click", function (event) {
    const targetId = link.getAttribute("href");
    if (targetId === "#") return;

    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    event.preventDefault();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    targetElement.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });

    if (el.mainNav && el.mainNav.classList.contains("open")) {
      el.mainNav.classList.remove("open");
      el.navToggle.setAttribute("aria-expanded", "false");
    }
  });
});

// MetaMask Account & Chain Event Handlers
if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("accountsChanged", function (accounts) {
    if (accounts.length === 0) {
      state.userAddress = null;
      state.mode = "demo";
      state.hasVoted = false;
      displayFeedback("MetaMask disconnected. Reverted to demo mode.", "info");
      renderAll();
    } else {
      console.log("MetaMask switched account to:", accounts[0]);
      connectWallet();
    }
  });

  window.ethereum.on("chainChanged", function (chainId) {
    console.log("MetaMask network switched to:", chainId);
    window.location.reload();
  });
}

/* ---------- 9. Initial Dashboard Boot ---------- */
function init() {
  // Check if this device already voted in cloud demo session
  const savedVote = localStorage.getItem("blockvote_voted_soujanya");
  if (savedVote) {
    state.hasVoted = true;
    state.votedCandidateId = Number(savedVote);
  }

  renderAll();

  // If user already authorized MetaMask previously, connect automatically
  if (typeof window.ethereum !== "undefined") {
    window.ethereum.request({ method: "eth_accounts" }).then(function (accounts) {
      if (accounts && accounts.length > 0) {
        connectWallet();
      } else {
        // Not connected to Web3: fetch live cloud tallies
        fetchCloudVotes();
      }
    }).catch(function (err) {
      console.log("Silent wallet check:", err);
      fetchCloudVotes();
    });
  } else {
    // Mobile phones or browsers without MetaMask: fetch live cloud tallies
    fetchCloudVotes();
  }

  // Poll live cloud tally every 4 seconds so laptop & all 50 phones update in real time!
  setInterval(function () {
    if (state.mode !== "web3") {
      fetchCloudVotes();
    }
  }, 4000);

  console.log("BlockVote initialized successfully with live cloud tally synchronization.");
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
