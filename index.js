import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { wrapHandler } from "./lib/errors.js";
import {
  getNetworkStatus,
  getSuggestedParams,
  getBlock,
  getAccount,
  getAsset,
  getApplication,
  getApplicationBoxes,
  getApplicationBox,
  getPendingTransaction,
  decodeTransaction,
  decodeSignedTransaction,
  simulateTransactions,
  compileTeal,
  disassembleTeal,
  paymentTxn,
  assetTransferTxn,
  assetOptinTxn,
} from "./lib/algod.js";
import {
  getTransaction,
  searchTransactions,
  getTransactionGroup,
} from "./lib/indexer.js";

const server = new McpServer({
  name: "ulu-core-mcp",
  version: "1.0.0",
});

// --- Network ---

server.tool(
  "get_network_status",
  "Get current node status (last round, sync state, versions)",
  { network: z.string().describe("Network identifier (e.g. algorand-mainnet, voi-mainnet)") },
  wrapHandler(getNetworkStatus),
);

server.tool(
  "get_suggested_params",
  "Get suggested transaction parameters (fee, validity window, genesis info)",
  { network: z.string().describe("Network identifier") },
  wrapHandler(getSuggestedParams),
);

server.tool(
  "get_block",
  "Get block information by round number",
  {
    network: z.string().describe("Network identifier"),
    round: z.number().int().describe("Block round number"),
  },
  wrapHandler(getBlock),
);

// --- Accounts / Assets / Apps ---

server.tool(
  "get_account",
  "Get account information including balance, assets, and auth address",
  {
    network: z.string().describe("Network identifier"),
    address: z.string().describe("Account public key / address"),
  },
  wrapHandler(getAccount),
);

server.tool(
  "get_asset",
  "Get asset information and configuration by ID",
  {
    network: z.string().describe("Network identifier"),
    assetId: z.number().int().describe("Asset ID"),
  },
  wrapHandler(getAsset),
);

server.tool(
  "get_application",
  "Get application information including global state and programs",
  {
    network: z.string().describe("Network identifier"),
    appId: z.number().int().describe("Application ID"),
  },
  wrapHandler(getApplication),
);

server.tool(
  "get_application_boxes",
  "List all application boxes",
  {
    network: z.string().describe("Network identifier"),
    appId: z.number().int().describe("Application ID"),
    maxBoxes: z.number().int().optional().describe("Maximum number of boxes to return"),
  },
  wrapHandler(getApplicationBoxes),
);

server.tool(
  "get_application_box",
  "Get a specific application box by name",
  {
    network: z.string().describe("Network identifier"),
    appId: z.number().int().describe("Application ID"),
    boxName: z.string().describe("Box name (base64-encoded)"),
  },
  wrapHandler(getApplicationBox),
);

// --- Transactions ---

server.tool(
  "get_transaction",
  "Look up a confirmed transaction by ID (from indexer)",
  {
    network: z.string().describe("Network identifier"),
    txId: z.string().describe("Transaction ID"),
  },
  wrapHandler(getTransaction),
);

server.tool(
  "get_pending_transaction",
  "Get pending transaction information by ID (from algod)",
  {
    network: z.string().describe("Network identifier"),
    txId: z.string().describe("Transaction ID"),
  },
  wrapHandler(getPendingTransaction),
);

server.tool(
  "search_transactions",
  "Search transaction history with filters",
  {
    network: z.string().describe("Network identifier"),
    address: z.string().optional().describe("Filter by account address"),
    addressRole: z.string().optional().describe("Address role: sender or receiver"),
    assetId: z.number().int().optional().describe("Filter by asset ID"),
    applicationId: z.number().int().optional().describe("Filter by application ID"),
    minRound: z.number().int().optional().describe("Minimum round"),
    maxRound: z.number().int().optional().describe("Maximum round"),
    afterTime: z.string().optional().describe("Only return transactions after this RFC 3339 time"),
    beforeTime: z.string().optional().describe("Only return transactions before this RFC 3339 time"),
    txType: z.string().optional().describe("Transaction type filter (pay, keyreg, acfg, axfer, afrz, appl, stpf)"),
    limit: z.number().int().optional().describe("Maximum results to return"),
    next: z.string().optional().describe("Pagination token"),
  },
  wrapHandler(searchTransactions),
);

server.tool(
  "get_transaction_group",
  "Get all transactions in a group, given any transaction ID from that group",
  {
    network: z.string().describe("Network identifier"),
    txId: z.string().describe("Any transaction ID from the group"),
  },
  wrapHandler(getTransactionGroup),
);

// --- Utilities ---

server.tool(
  "decode_transaction",
  "Decode a base64-encoded unsigned transaction into JSON",
  {
    txnBytes: z.string().describe("Base64-encoded unsigned transaction bytes (msgpack)"),
  },
  wrapHandler(decodeTransaction),
);

server.tool(
  "decode_signed_transaction",
  "Decode a base64-encoded signed transaction into JSON",
  {
    txnBytes: z.string().describe("Base64-encoded signed transaction bytes (msgpack)"),
  },
  wrapHandler(decodeSignedTransaction),
);

server.tool(
  "simulate_transactions",
  "Simulate signed or unsigned transactions without broadcasting",
  {
    network: z.string().describe("Network identifier"),
    txnBytes: z.array(z.string()).describe("Array of base64-encoded transaction bytes"),
  },
  wrapHandler(simulateTransactions),
);

server.tool(
  "compile_teal",
  "Compile TEAL source code into bytecode",
  {
    network: z.string().describe("Network identifier"),
    source: z.string().describe("TEAL source code"),
  },
  wrapHandler(compileTeal),
);

server.tool(
  "disassemble_teal",
  "Disassemble TEAL bytecode back into source",
  {
    network: z.string().describe("Network identifier"),
    bytecode: z.string().describe("Base64-encoded TEAL bytecode"),
  },
  wrapHandler(disassembleTeal),
);

// --- Transaction Builders ---

server.tool(
  "payment_txn",
  "Build an unsigned payment transaction for native ALGO/VOI transfers. Returns base64-encoded transaction bytes for signing.",
  {
    network: z.string().describe("Network identifier (e.g. algorand-mainnet, voi-mainnet)"),
    sender: z.string().describe("Sender wallet address"),
    receiver: z.string().describe("Receiver wallet address"),
    amount: z.string().describe("Amount in human-readable units (e.g. \"1.5\" for 1.5 ALGO/VOI)"),
    note: z.string().optional().describe("Arbitrary note (UTF-8 encoded to bytes)"),
  },
  wrapHandler(paymentTxn),
);

server.tool(
  "asset_transfer_txn",
  "Build an unsigned ASA transfer transaction. Amount is in base units (smallest denomination). Returns base64-encoded transaction bytes for signing.",
  {
    network: z.string().describe("Network identifier"),
    sender: z.string().describe("Sender wallet address"),
    receiver: z.string().describe("Receiver wallet address"),
    assetId: z.number().int().describe("ASA ID to transfer"),
    amount: z.string().describe("Amount in base (smallest) units as a string"),
    note: z.string().optional().describe("Arbitrary note (UTF-8 encoded to bytes)"),
  },
  wrapHandler(assetTransferTxn),
);

server.tool(
  "asset_optin_txn",
  "Build an unsigned ASA opt-in transaction (0-amount transfer to self). Returns base64-encoded transaction bytes for signing.",
  {
    network: z.string().describe("Network identifier"),
    sender: z.string().describe("Account address opting in (sends to self)"),
    assetId: z.number().int().describe("ASA ID to opt in to"),
  },
  wrapHandler(assetOptinTxn),
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
