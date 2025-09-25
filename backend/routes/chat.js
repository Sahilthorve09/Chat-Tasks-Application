const express = require('express');
const { Message, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Get messages for general room
router.get('/messages', async (req, res) => {
  try {
    const room = 'general';
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.findAll({
      where: { room, is_direct: false },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset: skip
    });

    // Normalize payload shape to include createdAt/timestamp
    const normalized = messages
      .reverse()
      .map(m => ({
        _id: m.id,
        id: m.id,
        content: m.content,
        sender: m.sender,
        createdAt: m.created_at,
        timestamp: m.created_at,
        room: m.room,
        type: 'room'
      }));

    res.json(normalized);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error while fetching messages' });
  }
});

// Get messages for a specific room
router.get('/messages/:room', async (req, res) => {
  try {
    const room = req.params.room;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.findAll({
      where: { room, is_direct: false },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset: skip
    });

    const normalized = messages
      .reverse()
      .map(m => ({
        _id: m.id,
        id: m.id,
        content: m.content,
        sender: m.sender,
        createdAt: m.created_at,
        timestamp: m.created_at,
        room: m.room,
        type: 'room'
      }));

    res.json(normalized);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error while fetching messages' });
  }
});

// Get list of available rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Message.findAll({
      attributes: [[Message.sequelize.fn('DISTINCT', Message.sequelize.col('room')), 'room']],
      raw: true
    });
    res.json(rooms.map(r => r.room));
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Server error while fetching rooms' });
  }
});

// Get all users with their status
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'created_at', 'presence_status', 'last_seen'],
      order: [['username', 'ASC']]
    });

    const online = global.getOnlineUsers ? global.getOnlineUsers() : new Map();

    const usersWithStatus = users.map(user => {
      const entry = online.get(user.id);
      if (entry) {
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          status: entry.status || 'online',
          last_seen: entry.lastSeen
        };
      }
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        status: user.presence_status || 'offline',
        last_seen: user.last_seen || null
      };
    });
    
    res.json(usersWithStatus);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// Get direct messages between current user and another user
router.get('/direct/:userId', async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    const currentUserId = req.user.id;
    
    if (!otherUserId || otherUserId === currentUserId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Create consistent room name for direct messages
    const roomName = `dm_${Math.min(currentUserId, otherUserId)}_${Math.max(currentUserId, otherUserId)}`;
    
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    
const messages = await Message.findAll({
      where: { room: roomName, is_direct: true },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset: skip
    });
    
    const normalized = messages
      .reverse()
      .map(m => ({
        _id: m.id,
        id: m.id,
        content: m.content,
        sender: m.sender,
        createdAt: m.created_at,
        timestamp: m.created_at,
        room: m.room,
        type: 'direct'
      }));

    res.json(normalized);
  } catch (error) {
    console.error('Get direct messages error:', error);
    res.status(500).json({ error: 'Server error while fetching direct messages' });
  }
});

// Delete a message (only sender can delete)
router.delete('/messages/:id', async (req, res) => {
  try {
    const deletedCount = await Message.destroy({
      where: {
        id: req.params.id,
        sender_id: req.user.id
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    // Broadcast deletion to all connected clients
    try {
      if (global.io) {
        global.io.emit('message_deleted', { id: Number(req.params.id) });
      }
    } catch (e) {
      console.error('Broadcast delete failed:', e.message);
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error while deleting message' });
  }
});

module.exports = router;