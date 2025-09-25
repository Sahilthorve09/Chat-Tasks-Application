const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const chatRoutes = require('./routes/chat');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const io = socketIo(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  }
});

// Expose io globally for routes that need to broadcast
global.io = io;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL database connection
connectDB();

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
  }
  
  res.json({ 
    status: 'ok', 
    message: 'Chat & Tasks API is running',
    timestamp: new Date().toISOString(),
    database: '',
    db_status: dbStatus
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', require('./routes/users'));

// Track online users
const onlineUsers = new Map(); // userId -> { socketId, username, status, lastSeen }

// Make onlineUsers accessible globally for API routes
global.getOnlineUsers = () => onlineUsers;

// Make onlineUsers accessible globally for API routes
global.onlineUsers = onlineUsers;

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', async (socket) => {
  console.log('User connected:', socket.userId, socket.user.username);
  
  // Add user to online users list
  const now = new Date();
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    username: socket.user.username,
    userId: socket.userId,
    status: 'online',
    lastSeen: now
  });

  // Persist presence status in DB
  try {
    const { User } = require('./models');
    await User.update({ presence_status: 'online', last_seen: now }, { where: { id: socket.userId } });
  } catch (e) {
    console.error('Failed to update user presence on connect:', e.message);
  }
  
  // Join user to a room with their ID (for direct messages)
  socket.join(`user_${socket.userId}`);
  
  // Broadcast user online status to all clients
  socket.broadcast.emit('user_status_changed', {
    userId: socket.userId,
    username: socket.user.username,
    status: 'online',
    lastSeen: now
  });
  
  // Send current online users to the newly connected user
  socket.emit('online_users_list', Array.from(onlineUsers.values()));
  
  // Handle joining chat rooms
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });
  
  // Handle manual status update
  socket.on('set_user_status', async (newStatus) => {
    const allowed = new Set(['online', 'away', 'busy']);
    if (!allowed.has(newStatus)) return;
    const entry = onlineUsers.get(socket.userId);
    const nowLocal = new Date();
    if (entry) {
      entry.status = newStatus;
      entry.lastSeen = nowLocal;
      onlineUsers.set(socket.userId, entry);
    }
    try {
      const { User } = require('./models');
      await User.update({ presence_status: newStatus, last_seen: nowLocal }, { where: { id: socket.userId } });
    } catch (e) {
      console.error('Failed to persist manual status:', e.message);
    }
    io.emit('user_status_changed', {
      userId: socket.userId,
      username: socket.user.username,
      status: newStatus,
      lastSeen: nowLocal
    });
  });

  // Heartbeat from client to update last seen
  socket.on('presence_ping', async () => {
    const entry = onlineUsers.get(socket.userId);
    const nowPing = new Date();
    if (entry) {
      entry.lastSeen = nowPing;
      onlineUsers.set(socket.userId, entry);
    }
    try {
      const { User } = require('./models');
      await User.update({ last_seen: nowPing }, { where: { id: socket.userId } });
    } catch {}
  });
  
  // Handle sending messages (room messages)
  socket.on('send_message', async (data) => {
    try {
      const { Message, User } = require('./models');
      const room = data.room || 'general';

      // Ensure sender is in the room
      try { socket.join(room); } catch {}
      
      const message = await Message.create({
        sender_id: socket.userId,
        content: data.content,
        room,
        message_type: 'text',
        is_direct: false
      });
      
      // Get message with sender info
      const messageWithSender = await Message.findByPk(message.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'username']
        }]
      });
      
      // Emit message to all users in the room
      io.to(data.room || 'general').emit('receive_message', {
        _id: messageWithSender.id,
        id: messageWithSender.id,
        content: messageWithSender.content,
        sender: messageWithSender.sender,
        createdAt: messageWithSender.created_at,
        timestamp: messageWithSender.created_at,
        room: messageWithSender.room,
        type: 'room'
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
  
  // Handle direct messages
  socket.on('send_direct_message', async (data) => {
    try {
      const { Message, User } = require('./models');
      const { recipientId, content } = data;
      
      if (!recipientId || !content) {
        socket.emit('error', { message: 'Recipient ID and content are required' });
        return;
      }
      
      // Create room name for direct message (always same order to ensure consistency)
      const roomName = `dm_${Math.min(socket.userId, recipientId)}_${Math.max(socket.userId, recipientId)}`;
      
      const message = await Message.create({
        sender_id: socket.userId,
        recipient_id: recipientId,
        content: content,
        room: roomName,
        is_direct: true,
        message_type: 'text'
      });
      
      // Get message with sender and recipient info
      const messageWithJoins = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username'] },
          { model: User, as: 'recipient', attributes: ['id', 'username'] }
        ]
      });
      
      const messageData = {
        _id: messageWithJoins.id,
        id: messageWithJoins.id,
        content: messageWithJoins.content,
        sender: messageWithJoins.sender,
        recipient: messageWithJoins.recipient,
        createdAt: messageWithJoins.created_at,
        timestamp: messageWithJoins.created_at,
        room: messageWithJoins.room,
        type: 'direct',
        recipientId: recipientId
      };
      
      // Send to both sender and recipient
      socket.emit('receive_direct_message', messageData);
      io.to(`user_${recipientId}`).emit('receive_direct_message', messageData);
      
    } catch (error) {
      console.error('Error sending direct message:', error);
      socket.emit('error', { message: 'Failed to send direct message' });
    }
  });
  
  // Handle requesting user list
  socket.on('get_online_users', () => {
    socket.emit('online_users_list', Array.from(onlineUsers.values()));
  });
  
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.userId, socket.user.username);
    
    // Remove user from online users list
    const userInfo = onlineUsers.get(socket.userId);
    if (userInfo) {
      onlineUsers.delete(socket.userId);
      const nowDisc = new Date();
      // Persist
      try {
        const { User } = require('./models');
        await User.update({ presence_status: 'offline', last_seen: nowDisc }, { where: { id: socket.userId } });
      } catch (e) {
        console.error('Failed to update user presence on disconnect:', e.message);
      }
      
      // Broadcast user offline status to all clients
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        username: socket.user.username,
        status: 'offline',
        lastSeen: nowDisc
      });
    }
  });
});

const PORT = process.env.PORT || 5001;

// Function to find an available port
const findAvailablePort = (startPort, maxAttempts = 10) => {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;
    
    const tryPort = () => {
      if (attempts >= maxAttempts) {
        reject(new Error(`Could not find available port after ${maxAttempts} attempts`));
        return;
      }
      
      const testServer = server.listen(currentPort, () => {
        testServer.close(() => {
          resolve(currentPort);
        });
      });
      
      testServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
          attempts++;
          currentPort++;
          tryPort();
        } else {
          reject(err);
        }
      });
    };
    
    tryPort();
  });
};

// Start server with port conflict handling
findAvailablePort(PORT)
  .then((availablePort) => {
    server.listen(availablePort, () => {
      console.log(`Server running on port ${availablePort}`);
      if (availablePort !== PORT) {
        console.log(`Note: Originally tried port ${PORT}, but it was in use`);
        console.log(`Update your frontend to connect to: http://localhost:${availablePort}`);
      }
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
