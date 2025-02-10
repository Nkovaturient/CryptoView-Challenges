const mongoose = require('mongoose');

const tokenBalanceSchema = new mongoose.Schema({
  tokenAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  tokenDetails: {
    name: String,
    symbol: String,
    decimals: Number
  },
  balance: {
    raw: String,
    formatted: Number
  },
  lastBlock: Number,
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
});

// Compound index for faster queries
tokenBalanceSchema.index({ tokenAddress: 1, walletAddress: 1 });

module.exports = mongoose.model('TokenBalance', tokenBalanceSchema);