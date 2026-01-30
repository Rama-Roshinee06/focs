const mongoose = require("mongoose");

const expenseProofSchema = new mongoose.Schema({
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
    receiptImage: String, // Base64 or URL
    description: String,
    uploadedAt: { type: Date, default: Date.now },
    receiptHash: String // Data integrity
});

module.exports = mongoose.model("ExpenseProof", expenseProofSchema);
