const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, city } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'Email or username already exists' });
    const finalName = name && name.trim() ? name.trim() : username;
    const user = new User({ name: finalName, username, email, password, city });
    await user.save();
    res.status(201).json({ message: 'Registered' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Login -> return JWT
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) return res.status(400).json({ message: 'Missing fields' });
    const ident = username || email;
    const user = await User.findOne({ $or: [{ username: ident }, { email: ident }] });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ token, user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
