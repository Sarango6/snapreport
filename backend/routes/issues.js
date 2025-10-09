const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');

// Create a new issue
router.post('/', async (req, res) => {
    try {
        const newIssue = new Issue(req.body);
        const savedIssue = await newIssue.save();
        res.status(201).json(savedIssue);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all issues
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find();
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update issue status
router.put('/:id', async (req, res) => {
    try {
        const updatedIssue = await Issue.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedIssue);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
