const mongoose = require("mongoose");

const TxnSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        index: true
    },
    hash: {
        type: String,
        required: true,
        unique: true
    },
    from: String,
    to: String,
    value: String,
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    blockNumber: Number,
    gasUsed: String,
    status: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const Txn = mongoose.model('Txn', TxnSchema);
module.exports = Txn;
