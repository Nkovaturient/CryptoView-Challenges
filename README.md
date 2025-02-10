## 1. TxnScan: Simple Cryptocurrency Transaction Tracking

- The Challenge: Build an API endpoint that accepts a cryptocurrency address (Ethereum, for example). It should retrieve the last 5 transactions for that address from a blockchain explorer API (e.g., Etherscan) and store them in MongoDB. Allow users to query for transactions by address and date range.
- Focus: Exposes knowledge of external APIs, data parsing, and efficient database storage.

## 2. TokenLens: Token Balance Lookup

- The Challenge: Build an API endpoint that accepts a token contract address and a wallet address. It should query the blockchain (using web3.js) to retrieve the balance of the specified token held by the wallet address and return the balance.
- Focus: Understanding of token contracts and token balance retrieval through web3.js.
