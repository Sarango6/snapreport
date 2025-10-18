const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const notify = require('../services/notify');
const User = require('../models/User');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup (in memory) - single image
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Create a new issue with a single image
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const body = req.body;
        // Validate required fields
        if (!body.title || !body.description || !body.category || !body.location) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Handle image upload to Cloudinary (single file)
        let uploadedUrls = [];
        if (req.file && req.file.buffer) {
            try {
                const resUrl = await new Promise((resolve, reject) => {
                    const s = cloudinary.uploader.upload_stream({ folder: 'snapreport' }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    });
                    streamifier.createReadStream(req.file.buffer).pipe(s);
                });
                uploadedUrls = [resUrl];
            } catch (e) { console.error('Cloudinary upload error', e); }
        }

        const issueData = {
            title: body.title,
            description: body.description,
            category: body.category,
            location: body.location,
            address: body.address || '',
            images: uploadedUrls
        };

        const newIssue = new Issue(issueData);
        const savedIssue = await newIssue.save();
        // Emit new issue for real-time map updates
        if (global.io) global.io.emit('new_issue', savedIssue);
        res.status(201).json(savedIssue);
    } catch (err) {
        console.error(err);
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
// Update issue (status updates should be restricted to Admin/Authority)
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Authority'), async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        const oldStatus = issue.status;
        // apply changes from body (we allow partial updates)
        Object.keys(req.body).forEach(k => { issue[k] = req.body[k]; });
        const updated = await issue.save();

        // If status changed, notify followers, creator, and emit socket event
        if (req.body.status && req.body.status !== oldStatus) {
            // Emit socket event
            if (global.io) global.io.to(`report_${issue._id}`).emit('status_update', { reportId: issue._id, status: issue.status });

            // Notify followers via email/SMS when possible
            if (issue.followers && issue.followers.length > 0) {
                const followers = await User.find({ _id: { $in: issue.followers } });
                for (const f of followers) {
                    try {
                        if (f.email) {
                            await notify.sendEmail(f.email, `Report status updated`, `The report "${issue.title}" status changed to ${issue.status}.`, `<p>The report <strong>${issue.title}</strong> status changed to <strong>${issue.status}</strong>.</p>`);
                        }
                        if (f.phone) {
                            await notify.sendSMS(f.phone, `Report "${issue.title}" status: ${issue.status}`);
                        }
                    } catch (e) { console.error('Notify follower error', e); }
                }
            }
            // Notify issue creator (if not already notified)
            try {
                // Try to find the creator by matching the first follower or by a creator field if available
                let creator = null;
                if (issue.followers && issue.followers.length > 0) {
                    creator = await User.findById(issue.followers[0]);
                }
                // If you have a creator field, use: creator = await User.findById(issue.creator);
                if (creator && creator.email) {
                    await notify.sendEmail(creator.email, `Your report status updated`, `Your report "${issue.title}" status changed to ${issue.status}.`, `<p>Your report <strong>${issue.title}</strong> status changed to <strong>${issue.status}</strong>.</p>`);
                }
            } catch (e) { console.error('Notify creator error', e); }
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
});

// Follow an issue
router.post('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });
        const userId = req.user._id;
        if (!issue.followers.includes(userId)) {
            issue.followers.push(userId);
            await issue.save();
        }
        res.json({ message: 'Following', followers: issue.followers });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Unfollow an issue
router.delete('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });
        const userId = req.user._id.toString();
        issue.followers = issue.followers.filter(f => f.toString() !== userId);
        await issue.save();
        res.json({ message: 'Unfollowed', followers: issue.followers });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;

