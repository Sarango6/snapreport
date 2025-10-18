const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { authenticateToken } = require('../middleware/auth');

// Add a comment to a report
router.post('/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Empty comment' });
    const comment = new Comment({ report: reportId, author: req.user._id, text });
    await comment.save();
    // Emit via Socket.io (if available on global)
    if (global.io) global.io.to(`report_${reportId}`).emit('comment', { reportId, comment });
    res.status(201).json(comment);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Get comments for a report
router.get('/:reportId', async (req, res) => {
  try {
    const comments = await Comment.find({ report: req.params.reportId }).populate('author', 'name');
    res.json(comments);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
