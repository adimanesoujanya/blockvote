// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockVote - Decentralized Electronic Voting Smart Contract
 * @author CSE Final Year Student Project
 * @notice A secure, transparent, and tamper-resistant electronic voting system.
 *         Ensures one-person-one-vote through Ethereum address verification and
 *         immutable cryptographic state.
 */
contract Voting {

    // ==========================================
    // 1. DATA STRUCTURES
    // ==========================================

    struct Candidate {
        uint256 id;             // Unique identifier (1, 2, 3...)
        string name;            // Full name of the candidate
        string role;            // Portfolio or policy division
        string manifesto;       // Key campaign agenda / summary
        uint256 voteCount;      // Total valid ballots cast for this candidate
    }

    struct Voter {
        bool hasVoted;          // Flag preventing double-voting
        uint256 votedCandidateId; // Candidate ID chosen by voter
        uint256 timestamp;      // Block timestamp when ballot was confirmed
    }

    // ==========================================
    // 2. STATE VARIABLES
    // ==========================================

    // The deploying account acts as the Election Commissioner (admin)
    address public immutable electionCommissioner;

    // Election title and operational status
    string public electionTitle;
    bool public electionActive;

    // Metrics
    uint256 public candidatesCount;
    uint256 public totalVotes;

    // Storage mappings
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;

    // ==========================================
    // 3. EVENTS (Indexed for Web3 / Frontend Listeners)
    // ==========================================

    event CandidateRegistered(uint256 indexed candidateId, string name, string role);
    event BallotCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event ElectionStatusChanged(bool isActive, uint256 timestamp);

    // ==========================================
    // 4. MODIFIERS
    // ==========================================

    modifier onlyCommissioner() {
        require(msg.sender == electionCommissioner, "BlockVote: Only Election Commissioner can call this");
        _;
    }

    modifier onlyWhenActive() {
        require(electionActive, "BlockVote: Election is not currently active");
        _;
    }

    // ==========================================
    // 5. CONSTRUCTOR
    // ==========================================

    /**
     * @notice Initializes the election with title and starting candidates.
     * @param _title Title of the election.
     * @param _names Array of candidate names.
     * @param _roles Array of candidate portfolio roles.
     * @param _manifestos Array of candidate manifesto descriptions.
     */
    constructor(
        string memory _title,
        string[] memory _names,
        string[] memory _roles,
        string[] memory _manifestos
    ) {
        require(_names.length == _roles.length && _roles.length == _manifestos.length, "BlockVote: Input array lengths mismatch");
        require(_names.length > 0, "BlockVote: Must register at least one candidate");

        electionCommissioner = msg.sender;
        electionTitle = _title;
        electionActive = true;

        for (uint256 i = 0; i < _names.length; i++) {
            _addCandidate(_names[i], _roles[i], _manifestos[i]);
        }

        emit ElectionStatusChanged(true, block.timestamp);
    }

    // ==========================================
    // 6. INTERNAL & ADMIN FUNCTIONS
    // ==========================================

    /**
     * @dev Internal helper to register candidate into storage.
     */
    function _addCandidate(
        string memory _name,
        string memory _role,
        string memory _manifesto
    ) internal {
        candidatesCount++;
        candidates[candidatesCount] = Candidate({
            id: candidatesCount,
            name: _name,
            role: _role,
            manifesto: _manifesto,
            voteCount: 0
        });

        emit CandidateRegistered(candidatesCount, _name, _role);
    }

    /**
     * @notice Adds a candidate dynamically (Commissioner only).
     */
    function addCandidate(
        string memory _name,
        string memory _role,
        string memory _manifesto
    ) external onlyCommissioner {
        _addCandidate(_name, _role, _manifesto);
    }

    /**
     * @notice Toggles election active state (Commissioner only).
     */
    function setElectionStatus(bool _active) external onlyCommissioner {
        electionActive = _active;
        emit ElectionStatusChanged(_active, block.timestamp);
    }

    // ==========================================
    // 7. CORE VOTING LOGIC
    // ==========================================

    /**
     * @notice Casts a single tamper-proof ballot for a certified candidate.
     * @dev Reverts if the sender has already voted or if the candidateId is invalid.
     * @param _candidateId The unique ID of the selected candidate.
     */
    function vote(uint256 _candidateId) external onlyWhenActive {
        // Cryptographic check 1: Double-voting prevention
        require(!voters[msg.sender].hasVoted, "BlockVote: Address has already cast a ballot");

        // Cryptographic check 2: Candidate existence verification
        require(_candidateId > 0 && _candidateId <= candidatesCount, "BlockVote: Invalid candidate ID");

        // Record voter participation on immutable ledger
        voters[msg.sender] = Voter({
            hasVoted: true,
            votedCandidateId: _candidateId,
            timestamp: block.timestamp
        });

        // Tally vote
        candidates[_candidateId].voteCount++;
        totalVotes++;

        // Emit public blockchain event for real-time frontend listener
        emit BallotCast(msg.sender, _candidateId, block.timestamp);
    }

    // ==========================================
    // 8. VIEW / QUERY FUNCTIONS (Gas Free for Readers)
    // ==========================================

    /**
     * @notice Checks whether a given address has cast a ballot.
     */
    function hasAddressVoted(address _voter) external view returns (bool) {
        return voters[_voter].hasVoted;
    }

    /**
     * @notice Returns voter ballot details (only readable by voter or commissioner).
     */
    function getVoterReceipt(address _voter) external view returns (bool voted, uint256 candidateId, uint256 timestamp) {
        Voter memory v = voters[_voter];
        return (v.hasVoted, v.votedCandidateId, v.timestamp);
    }

    /**
     * @notice Retrieves all candidates in a single batch call.
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory list = new Candidate[](candidatesCount);
        for (uint256 i = 1; i <= candidatesCount; i++) {
            list[i - 1] = candidates[i];
        }
        return list;
    }

    /**
     * @notice Retrieves the currently leading candidate.
     */
    function getLeader() external view returns (
        uint256 leaderId,
        string memory leaderName,
        uint256 maxVotes
    ) {
        uint256 topVotes = 0;
        uint256 topId = 0;
        string memory topName = "";

        for (uint256 i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > topVotes) {
                topVotes = candidates[i].voteCount;
                topId = candidates[i].id;
                topName = candidates[i].name;
            }
        }

        return (topId, topName, topVotes);
    }

    /**
     * @notice Returns core election statistics for dashboard display.
     */
    function getStats() external view returns (
        string memory title,
        bool active,
        uint256 candidateCount,
        uint256 totalVotesCast,
        address commissioner
    ) {
        return (electionTitle, electionActive, candidatesCount, totalVotes, electionCommissioner);
    }
}
