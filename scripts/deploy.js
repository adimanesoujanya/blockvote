/**
 * BlockVote - Smart Contract Deployment & Verification Script
 * 
 * Target Network: Ganache Local RPC (http://127.0.0.1:7545)
 * 
 * Usage:
 *   node scripts/deploy.js
 */

const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log("   BlockVote - Solidity Smart Contract Deployment");
  console.log("==================================================\n");

  const rpcUrl = "http://127.0.0.1:7545";
  console.log(`Connecting to Ganache RPC at: ${rpcUrl}...`);

  // Default Candidate Seed Data
  const electionTitle = "University General Election 2026";
  const candidateNames = ["Dr. Evelyn Reed", "Marcus Vance", "Sophia Chen"];
  const candidateRoles = [
    "Digital Rights & Open Data",
    "Decentralized Infrastructure",
    "AI Ethics & Public Policy"
  ];
  const candidateManifestos = [
    "Focusing on cryptographic transparency in public systems and algorithmic accountability.",
    "Championing decentralized identity protocols, green energy networks, and tamper-resistant ledgers.",
    "Advocating for ethical AI deployment, privacy-preserving governance, and civic participation."
  ];

  let ethers;
  try {
    ethers = require("ethers");
  } catch (err) {
    console.log("Tip: 'ethers' package not found locally. You can either:");
    console.log(" 1) Run 'npm install' to use this automated Node.js script.");
    console.log(" 2) Or deploy instantly in 30 seconds via Remix IDE (Recommended for Viva)!\n");
    printRemixGuide();
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    console.log(`✓ Connected to Ganache! Network Chain ID: ${network.chainId}`);

    // Get the first unlocked account from Ganache
    const signer = await provider.getSigner(0);
    const deployerAddress = await signer.getAddress();
    const balance = await provider.getBalance(deployerAddress);
    console.log(`✓ Deployer Account (Commissioner): ${deployerAddress}`);
    console.log(`✓ Account Balance: ${ethers.formatEther(balance)} ETH\n`);

    // Load ABI from contract-config.js
    const configPath = path.join(__dirname, "..", "public", "contract-config.js");
    const configRaw = fs.readFileSync(configPath, "utf8");

    // Read Solidity Source
    const solPath = path.join(__dirname, "..", "contracts", "Voting.sol");
    const solSource = fs.readFileSync(solPath, "utf8");

    let solc;
    try {
      solc = require("solc");
    } catch (e) {
      console.log("Notice: 'solc' compiler not installed locally.");
      printRemixGuide();
      return;
    }

    console.log("Compiling Voting.sol using Solidity compiler...");
    const input = {
      language: "Solidity",
      sources: {
        "Voting.sol": { content: solSource }
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode"]
          }
        }
      }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors) {
      for (const err of output.errors) {
        if (err.severity === "error") {
          throw new Error("Compilation Error: " + err.formattedMessage);
        }
      }
    }

    const compiledContract = output.contracts["Voting.sol"]["Voting"];
    const abi = compiledContract.abi;
    const bytecode = compiledContract.evm.bytecode.object;

    console.log("✓ Contract compiled successfully!");
    console.log("Deploying Voting.sol to Ganache...");

    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy(
      electionTitle,
      candidateNames,
      candidateRoles,
      candidateManifestos
    );

    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();

    console.log("\n==================================================");
    console.log(`🎉 Voting Contract Successfully Deployed!`);
    console.log(`   Address: ${deployedAddress}`);
    console.log("==================================================\n");

    // Automatically update public/contract-config.js
    let updatedConfig = configRaw.replace(
      /CONTRACT_ADDRESS:\s*"0x[a-fA-F0-9]+"/,
      `CONTRACT_ADDRESS: "${deployedAddress}"`
    );

    fs.writeFileSync(configPath, updatedConfig, "utf8");
    console.log(`✓ Updated public/contract-config.js with the new contract address.`);
    console.log(`\nYou are now ready! Open public/index.html and click 'Connect MetaMask' to vote.\n`);

  } catch (deployErr) {
    console.error("Deployment failed:", deployErr.message || deployErr);
    console.log("\nAlternative deployment method:");
    printRemixGuide();
  }
}

function printRemixGuide() {
  console.log("--------------------------------------------------");
  console.log(" Quickest Viva / College Lab Deployment (Remix IDE):");
  console.log("--------------------------------------------------");
  console.log("1. Open your browser and go to: https://remix.ethereum.org");
  console.log("2. Create a new file under 'contracts' named 'Voting.sol'");
  console.log("3. Copy & paste the code from: contracts/Voting.sol");
  console.log("4. In the Solidity Compiler tab, select version '0.8.20' and click 'Compile Voting.sol'");
  console.log("5. In the 'Deploy & Run Transactions' tab:");
  console.log("   - Select ENVIRONMENT: 'Injected Provider - MetaMask' (connected to Ganache)");
  console.log("   - Enter constructor parameters or leave default");
  console.log("   - Click 'Deploy' and confirm the MetaMask transaction!");
  console.log("6. Copy the deployed contract address and paste it into:");
  console.log("   public/contract-config.js -> CONTRACT_ADDRESS");
  console.log("--------------------------------------------------\n");
}

main().catch(console.error);
