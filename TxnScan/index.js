const express = require('express');
const { Web3 } = require('web3');
const axios = require('axios');
const { body, query, validationResult } = require('express-validator');
const cors = require('cors');
require('dotenv').config();
const connectDb = require('./config/db');
const Txn = require('./model/txnLog');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
connectDb();
const PORT = process.env.PORT || 8000;

// Initialize Web3 and Etherscan API
let web3
try {
    web3 = new Web3(
        new Web3.providers.HttpProvider(
            process.env.ETH_RPC_URL || 'https://sepolia.infura.io/v3/e5c8c620a1f341d8b6e94ec1d00e3291'
        )
    );
    console.log('Web3 initialized successfully');
} catch (error) {
    console.log('Web3 initialization error:', error);
}

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_API = 'https://api.etherscan.io/api';

// Validation middleware
const validateAddress = [
    body('address').isEthereumAddress().withMessage('Invalid Ethereum address')
];

const validateDateRange = [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

// Fetch and store transactions
app.post('/api/transactions/fetch', validateAddress, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address } = req.body;
        const normalizedAddress = address.toLowerCase();

        // Fetch transactions from Etherscan
        const response = await axios.get(ETHERSCAN_API, {
            params: {
                module: 'account',
                action: 'txlist',
                address: normalizedAddress,
                startblock: 0,
                endblock: 99999999,
                page: 1,
                offset: 5, // Last 5 transactions
                sort: 'desc',
                apikey: ETHERSCAN_API_KEY
            }
        });

        if (response.data.status !== '1') {
            throw new Error(response.data.message || 'Failed to fetch transactions');
        }

        // Process and store transactions
        const transactions = await Promise.all(response.data.result.map(async (tx) => {
            const transaction = {
                address: normalizedAddress,
                hash: tx.hash,
                from: tx.from.toLowerCase(),
                to: tx.to?.toLowerCase(),
                value: tx.value,
                timestamp: new Date(parseInt(tx.timeStamp) * 1000),
                blockNumber: parseInt(tx.blockNumber),
                gasUsed: tx.gasUsed,
                status: tx.isError === '0' ? 'success' : 'failed'
            };

            // Upsert transaction
            await Txn.findOneAndUpdate(
                { hash: tx.hash },
                transaction,
                { upsert: true, new: true }
            );

            return transaction;
        }));

        res.json({
            success: true,
            data: transactions
        });

    } catch (error) {
        console.log('Transaction fetch error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions',
            details: error.message
        });
    }
});

//Query transactions
app.get('/api/transactions/:address', validateDateRange, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { address } = req.params;
        const { startDate, endDate } = req.query;
        const normalizedAddress = address.toLowerCase();

        // Build query
        const query = { address: normalizedAddress };
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // Fetch transactions
        const transactions = await Txn.find(query)
            .sort({ timestamp: -1 })
            .limit(100);

        res.json({
            success: true,
            data: transactions
        });

    } catch (error) {
        console.error('Transaction query error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to query transactions',
            details: error.message
        });
    }
});

// Get transaction stats
app.get('/api/transactions/:address/stats',  async (req, res) => {
    try {
        const { address } = req.params;
        const normalizedAddress = address.toLowerCase();

        const stats = await Txn.aggregate([
            { $match: { address: normalizedAddress } },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalValue: { $sum: { $toDouble: "$value" } },
                    avgGasUsed: { $avg: { $toDouble: "$gasUsed" } }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || { totalTransactions: 0, totalValue: 0, avgGasUsed: 0 }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transaction stats',
            details: error.message
        });
    }
});

// Insert demo data
app.get('/api/transaction/data', async(req, res)=>{
    try {

        const demoTransactions = [
            {
                address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                hash: "0x8a5f0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
                from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                to: "0x1234567890123456789012345678901234567890",
                value: "1000000000000000000", // 1 ETH in wei
                timestamp: new Date("2024-03-14T10:00:00Z"),
                blockNumber: 21809821,
                gasUsed: "21000",
                status: "success",
                lastUpdated: new Date()
            },
            {
                address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                hash: "0x9b8a7c6d5e4f3b2a1c0d9e8f7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f",
                from: "0x9876543210987654321098765432109876543210",
                to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                value: "500000000000000000", // 0.5 ETH in wei
                timestamp: new Date("2024-03-14T11:30:00Z"),
                blockNumber: 21809900,
                gasUsed: "21000",
                status: "success",
                lastUpdated: new Date()
            },
            {
                address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                hash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
                from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                to: "0x5555666677778888999900001111222233334444",
                value: "2000000000000000000", // 2 ETH in wei
                timestamp: new Date("2024-03-14T12:45:00Z"),
                blockNumber: 21809950,
                gasUsed: "21000",
                status: "success",
                lastUpdated: new Date()
            }
        ];

           await Txn.insertMany(demoTransactions)
                   .then((save)=>{
                    console.log('Demo data inserted successfully:', save);
                    return res.status(200).json({success: true, data: save, message: 'Demo data inserted successfully'});

                    })
                   .catch((err)=>{
                       return res.json(`Oops couldnt save data! ${err.message}`);
                   })
        

    } catch (error) {
        console.log('Error seeding data:', error.message);
    } 
});

app.get("/home", (req, res)=>{
    res.send(`Transaction Detective on its way!`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}/home`);
});