const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recipient_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 1000]
    }
  },
  room: {
    type: DataTypes.STRING(50),
    defaultValue: 'general'
  },
  is_direct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  message_type: {
    type: DataTypes.ENUM('text', 'system'),
    defaultValue: 'text'
  }
}, {
  tableName: 'messages',
  indexes: [
    {
      fields: ['room', 'created_at']
    },
    {
      fields: ['sender_id', 'recipient_id', 'created_at']
    }
  ]
});

module.exports = Message;
