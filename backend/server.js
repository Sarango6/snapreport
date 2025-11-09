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
const authRoutes = require('./routes/auth');
app.use('/api/issues', issuesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);



// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

.then(async () => {
  console.log('MongoDB connected');
  // Seed admin user if not exists
  const User = require('./models/User');
  const adminEmail = 'admin@example.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'admin',
      username: 'admin',
      email: adminEmail,
      password: 'admin123', // plain password, will be hashed by User model
      role: 'Admin',
      verified: true
    });
    console.log('Default admin user created:', adminEmail);
  } else {
    // Ensure admin has a username after schema change
    if (!admin.username) {
      admin.username = 'admin';
      await admin.save();
      console.log('Admin user updated with username: admin');
    }
    console.log('Admin user already exists:', adminEmail);
  }
})
.catch(err => console.log(err));

// Start server with Socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Simple Socket.io namespace for comments/real-time updates
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('joinReport', (reportId) => {
    socket.join(`report_${reportId}`);
  });
  socket.on('leaveReport', (reportId) => {
    socket.leave(`report_${reportId}`);
  });
  socket.on('comment', (data) => {
    // broadcast comment to room
    io.to(`report_${data.reportId}`).emit('comment', data);
  });
});

// Make io available to routes/services
global.io = io;

// Register additional routes
const commentsRoutes = require('./routes/comments');
app.use('/api/comments', commentsRoutes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
