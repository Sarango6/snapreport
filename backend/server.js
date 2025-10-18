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
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    await User.create({
      name: 'admin',
      email: adminEmail,
      password: 'admin123', // plain password, will be hashed by User model
      role: 'Admin',
      verified: true
    });
    console.log('Default admin user created:', adminEmail);
  } else {
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

// Admin analytics & export endpoints (stubs) - protected by auth + Admin role
const Issue = require('./models/Issue');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { authenticateToken, authorizeRoles } = require('./middleware/auth');

app.get('/api/admin/analytics', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const total = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'Resolved' });
    const byCategory = await Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ total, resolved, byCategory });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/export/csv', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const issues = await Issue.find(filter).lean();
    const fields = ['_id','title','description','category','location','address','status','createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(issues);
    res.header('Content-Type', 'text/csv');
    res.attachment('issues.csv');
    return res.send(csv);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/admin/export/pdf', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const issues = await Issue.find(filter).lean();
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename=issues.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Issues Report', { align: 'center' });
    doc.moveDown();
    issues.forEach(iss => {
      doc.fontSize(12).text(`Title: ${iss.title}`);
      doc.text(`Category: ${iss.category} | Status: ${iss.status}`);
      doc.text(`Location: ${iss.address || iss.location}`);
      doc.text(`Description: ${iss.description}`);
      doc.moveDown();
    });
    doc.end();
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
