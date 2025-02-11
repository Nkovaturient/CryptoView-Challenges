## 1. TxnScan: Simple Cryptocurrency Transaction Tracking

- The Challenge: Build an API endpoint that accepts a cryptocurrency address (Ethereum, for example). It should retrieve the last 5 transactions for that address from a blockchain explorer API (e.g., Etherscan) and store them in MongoDB. Allow users to query for transactions by address and date range.
- Focus: Exposes knowledge of external APIs, data parsing, and efficient database storage.

### 1. Core Technologies Used 🛠️

- **Express.js**: A web framework for Node.js that handles HTTP requests
- **Web3.js**: Library to interact with Ethereum blockchain
- **MongoDB**: Database to store transaction data
- **Etherscan API**: External service to fetch Ethereum transaction data

### 2. Key Components 🔑

#### A. Setup and Configuration
```javascript
const web3 = new Web3(process.env.ETH_RPC_URL);
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
```
- **RPC URL**: Connection point to Ethereum network (using Sepolia testnet)
- **Etherscan API**: Access to blockchain data without running a full node

#### B. Main Features 📋

1. **Transaction Fetching** (`/api/transactions/fetch`)
   - Fetches last 5 transactions for an Ethereum address
   - Validates Ethereum addresses using express-validator
   - Stores transactions in MongoDB for quick future access

2. **Transaction Querying** (`/api/transactions/:address`)
   - Retrieves stored transactions with date filtering
   - Supports pagination (100 transactions per request)
   - Data is pre-processed and stored for faster retrieval

3. **Transaction Statistics** (`/api/transactions/:address/stats`)
   - Calculates important metrics:
     - Total number of transactions
     - Total value transferred
     - Average gas used

## 2. TokenLens: Token Balance Lookup

- The Challenge: Build an API endpoint that accepts a token contract address and a wallet address. It should query the blockchain (using web3.js) to retrieve the balance of the specified token held by the wallet address and return the balance.
- Focus: Understanding of token contracts and token balance retrieval through web3.js.

### 1. Core Setup & Infrastructure 🏗️

```javascript
const web3 = new Web3(process.env.ETH_RPC_URL);
```
- **Web3**: The gateway to interact with Ethereum blockchain
- **RPC URL**: Like a phone line to communicate with Ethereum network
- **Sepolia**: A test network for Ethereum (mentioned in the fallback URL)

### 2. Smart Contract Interface (ABI) 📘
```javascript
const tokenABI = [
    // balanceOf, symbol, name, decimals functions
];
```
- **ABI (Application Binary Interface)**: The "instruction manual" for interacting with smart contracts
- **Functions Included**:
  - `balanceOf`: Check token balance
  - `symbol`: Get token symbol (like "USDT")
  - `name`: Get token name (like "Tether USD")
  - `decimals`: Get token precision (usually 18)

### 3. API Endpoints 🛣️

#### A. Token Balance Endpoint (`/api/token-balance`)
```javascript
app.post('/api/token-balance', validateRequest, async (req, res) => {
    // ... code
});
```
**What it does:**
- Takes token and wallet addresses
- Fetches token details and balance
- Returns formatted data

**Smart Features:**
- Parallel data fetching using `Promise.all`
- Address normalization for consistency
- Balance conversion from Wei to Ether
- Comprehensive error handling

#### B. Token Info Endpoint (`/api/token-info/:tokenAddress`)
```javascript
app.get('/api/token-info/:tokenAddress', async (req, res) => {
    // ... code
});
```
**Purpose:**
- Quick token detail lookup
- Validates token existence
- Returns basic token information
