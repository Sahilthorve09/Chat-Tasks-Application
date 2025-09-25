const express = require('express');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get list of online users with status
router.get('/online', authenticateToken, async (req, res) => {
  try {
    const online = global.getOnlineUsers ? global.getOnlineUsers() : new Map();
    const list = Array.from(online.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      status: u.status || 'online',
      lastSeen: u.lastSeen
    }));
    res.json(list);
  } catch (e) {
    console.error('Get online users error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a user's presence status
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });

    const online = global.getOnlineUsers ? global.getOnlineUsers() : new Map();
    const entry = online.get(id);
    if (entry) {
      return res.json({
        userId: id,
        username: entry.username,
        status: entry.status || 'online',
        lastSeen: entry.lastSeen
      });
    }

    const user = await User.findByPk(id, { attributes: ['id', 'username', 'presence_status', 'last_seen'] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      userId: user.id,
      username: user.username,
      status: user.presence_status || 'offline',
      lastSeen: user.last_seen || null
    });
  } catch (e) {
    console.error('Get user status error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set current user's presence status
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = new Set(['online', 'away', 'busy', 'offline']);
    if (!allowed.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const now = new Date();
    await User.update({ presence_status: status, last_seen: now }, { where: { id: req.user.id } });

    const online = global.getOnlineUsers ? global.getOnlineUsers() : new Map();
    const entry = online.get(req.user.id);
    if (entry) {
      entry.status = status;
      entry.lastSeen = now;
      online.set(req.user.id, entry);
      // Broadcast change
      if (global.io) {
        global.io.emit('user_status_changed', {
          userId: req.user.id,
          username: entry.username,
          status,
          lastSeen: now
        });
      }
    }

    res.json({ message: 'Status updated', status, lastSeen: now });
  } catch (e) {
    console.error('Set user status error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
