const express = require('express');
const { Todo } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Get all todos for the authenticated user
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.findAll({ 
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    
    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Server error while fetching todos' });
  }
});

// Get a specific todo by ID
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      where: { 
        id: req.params.id, 
        user_id: req.user.id 
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({ error: 'Server error while fetching todo' });
  }
});

// Create a new todo
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const todo = await Todo.create({
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || 'medium',
      due_date: dueDate ? new Date(dueDate) : null,
      user_id: req.user.id
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Server error while creating todo' });
  }
});

// Update a todo
router.put('/:id', async (req, res) => {
  try {
    const { title, description, completed, priority, dueDate } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (completed !== undefined) updateData.completed = completed;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.due_date = dueDate ? new Date(dueDate) : null;

    const [updatedCount] = await Todo.update(updateData, {
      where: { 
        id: req.params.id, 
        user_id: req.user.id 
      }
    });

    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const todo = await Todo.findByPk(req.params.id);
    res.json(todo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Server error while updating todo' });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    const deletedCount = await Todo.destroy({ 
      where: {
        id: req.params.id, 
        user_id: req.user.id 
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Server error while deleting todo' });
  }
});

// Toggle todo completion status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      where: {
        id: req.params.id, 
        user_id: req.user.id 
      }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.json(todo);
  } catch (error) {
    console.error('Toggle todo error:', error);
    res.status(500).json({ error: 'Server error while toggling todo' });
  }
});

module.exports = router;