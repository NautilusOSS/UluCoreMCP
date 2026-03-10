# UluCoreMCP

Low-level blockchain interface MCP server for Algorand and Voi networks.

Provides chain primitives: account/asset/app inspection, transaction search, block retrieval, TEAL compilation, and transaction simulation.

## Setup

```bash
npm install
```

## Usage

```bash
node index.js
```

## Adding to a Client

```json
{
  "mcpServers": {
    "ulu-core-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/UluCoreMCP/index.js"]
    }
  }
}
```

## Supported Networks

| Network             | Chain    |
| ------------------- | -------- |
| `algorand-mainnet`  | Algorand |
| `voi-mainnet`       | Voi      |

Default endpoints use [Nodely](https://nodely.io) public APIs. Override via the `ULU_CORE_NETWORKS` environment variable:

```json
{
  "algorand-mainnet": {
    "chain": "algorand",
    "algodUrl": "https://your-algod-url",
    "algodToken": "",
    "indexerUrl": "https://your-indexer-url",
    "indexerToken": ""
  }
}
```

## Tools

### Network
- **get_network_status** — Node status (last round, sync state)
- **get_suggested_params** — Suggested transaction parameters
- **get_block** — Block info by round number

### Accounts / Assets / Apps
- **get_account** — Account info (balance, assets, auth address)
- **get_asset** — Asset info by ID
- **get_application** — Application info (global state, programs)
- **get_application_boxes** — List application boxes
- **get_application_box** — Get a specific box by name (base64)

### Transactions
- **get_transaction** — Look up confirmed transaction by ID
- **get_pending_transaction** — Pending transaction info
- **search_transactions** — Search with filters (address, asset, app, round range, time range, type)
- **get_transaction_group** — All transactions in a group

### Utilities
- **decode_transaction** — Decode unsigned transaction bytes to JSON
- **decode_signed_transaction** — Decode signed transaction bytes to JSON
- **simulate_transactions** — Simulate transactions without broadcasting
- **compile_teal** — Compile TEAL source to bytecode
- **disassemble_teal** — Disassemble TEAL bytecode to source

## Architecture

```
index.js              MCP server + tool registration
lib/
  config.js           Network configuration loader
  errors.js           Error handling utilities
  networks.js         Algod/Indexer client manager
  algod.js            Algod wrapper functions
  indexer.js          Indexer wrapper functions
  normalize.js        Response normalization (BigInt → string, Uint8Array → base64)
```

## Design

UluCoreMCP returns **facts**, not interpretation. Raw chain data is normalized for JSON safety (BigInts become strings, byte arrays become base64) but otherwise passed through unmodified.

Protocol-specific logic, ecosystem conventions, wallet management, and transaction signing belong to higher-layer MCPs.

## Limitations

- Read-only: no signing, no broadcasting, no wallet management
- Algorand/Voi only (both use the same AVM client logic)
- Transaction group retrieval fetches all transactions in a round and filters by group ID
- Box names must be base64-encoded
