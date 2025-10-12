// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const path = require('path');

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Redirect all other routes to frontend index.html (for SPA)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});



// Routes
const issuesRoutes = require('./routes/issues');
const usersRoutes = require('./routes/users');
app.use('/api/issues', issuesRoutes);
app.use('/api/users', usersRoutes);



// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
