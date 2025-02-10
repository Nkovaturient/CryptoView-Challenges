const express = require('express');
const {Web3} = require('web3');
const { body, validationResult } = require('express-validator');
const cors=require('cors')
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


// Initialize Web3
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

// ERC20 Token ABI (minimal for balanceOf function)
const tokenABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
];

// Validation middleware
const validateRequest = [
    body('tokenAddress').isEthereumAddress().withMessage('Invalid token address'),
    body('walletAddress').isEthereumAddress().withMessage('Invalid wallet address'),
];

// Token balance endpoint
app.post('/api/token-balance', validateRequest, async (req, res) => {
    try {
        // Validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { tokenAddress, walletAddress } = req.body;

        // Normalize addresses
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedWalletAddress = walletAddress.toLowerCase();

        const tokenContract = new web3.eth.Contract(tokenABI, normalizedTokenAddress);
        
        // Get token details and balance in parallel
        const [symbol, name, decimals, rawBalance] = await Promise.all([
            tokenContract.methods.symbol().call().catch(() => 'UNKNOWN'),
            tokenContract.methods.name().call().catch(() => 'Unknown Token'),
            tokenContract.methods.decimals().call().catch(() => '18'),
            tokenContract.methods.balanceOf(normalizedWalletAddress).call()
        ]).catch(error => {
            console.log('Contract call error:', error.message);
            throw new Error('Failed to fetch token data');
        });

        // Get current block--Convert block number from bigint to number
        const currentBlock = Number(await web3.eth.getBlockNumber());

        // Format balance
        const formattedBalance = web3.utils.fromWei(rawBalance, 'ether');

        // Prepare token data
        const tokenData = {
            tokenAddress: normalizedTokenAddress,
            walletAddress: normalizedWalletAddress,
            tokenDetails: {
                name,
                symbol,
                decimals: parseInt(decimals)
            },
            balance: {
                raw: rawBalance.toString(),
                formatted: parseFloat(formattedBalance)
            },
            lastBlock: currentBlock,
            lastUpdated: new Date()
        };

        // Update cache
        // await TokenBalance.findOneAndUpdate(
        //     { 
        //         tokenAddress: normalizedTokenAddress, 
        //         walletAddress: normalizedWalletAddress 
        //     },
        //     tokenData,
        //     { 
        //         upsert: true, 
        //         new: true,
        //         setDefaultsOnInsert: true
        //     }
        // );

        // Send response
        return res.status(200).json({
            success: true,
            data: {
                ...tokenData,
                cached: false
            }
        });

    } catch (error) {
        console.log('Token balance error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch token balance',
            details: error.message
        });
    }
});

// Helper endpoint to check token details
app.get('/api/token-info/:tokenAddress', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        
        if (!web3.utils.isAddress(tokenAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token address'
            });
        }

        const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
        
        const [symbol, name, decimals] = await Promise.all([
            tokenContract.methods.symbol().call(),
            tokenContract.methods.name().call(),
            tokenContract.methods.decimals().call()
        ]);

        res.json({
            success: true,
            data: {
                address: tokenAddress,
                name,
                symbol,
                decimals: parseInt(decimals)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch token info',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong! Try again later.',
        details: err.message
    });
});       


// Start server
const PORT = process.env.PORT || 4000;

app.get("/home", (req, res)=>{
    res.send(`Got new TokenLens!`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}/home`);
});