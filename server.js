const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// MongoDB connection string
const mongoURI = 'mongodb+srv://iamhritikpawar:pawar2700@bookkeeper.hv4oh.mongodb.net/whiteboard?retryWrites=true&w=majority';

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define schema for drawing paths
const pathSchema = new mongoose.Schema({
  points: [{ x: Number, y: Number }],
  color: String,
  mode: String, // 'draw' or 'erase'
  timestamp: { type: Date, default: Date.now },
});
const Path = mongoose.model('Path', pathSchema);

// Serve static files (React build)
app.use(express.static('public'));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send all existing paths to new client
  Path.find().then((paths) => {
    socket.emit('loadPaths', paths);
  }).catch((err) => console.error('Error fetching paths:', err));

  // Handle new drawing path
  socket.on('draw', async (data) => {
    try {
      const path = new Path(data);
      await path.save();
      socket.broadcast.emit('draw', data); // Broadcast to other clients
    } catch (err) {
      console.error('Error saving path:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});