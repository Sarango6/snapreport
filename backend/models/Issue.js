const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true }, // coordinates
    address: { type: String }, // human-readable address
    images: [{ type: String }],       // Array of image URLs
    status: { type: String, default: "Pending" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', issueSchema);
