const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true }, // coordinates
    address: { type: String }, // human-readable address
    imageURL: { type: String },       // Optional: link to image
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', issueSchema);
