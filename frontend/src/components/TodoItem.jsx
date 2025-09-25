import React, { useState } from 'react';

const TodoItem = ({ todo, onEdit, onDelete, onToggle }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !todo.completed;
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await onDelete(todo.id);
      } catch (error) {
        console.error('Error deleting todo:', error);
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
      todo.completed ? 'opacity-75' : ''
    } ${isDeleting ? 'opacity-50' : ''}`}>
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            todo.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {todo.completed && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className={`font-medium text-gray-900 ${
                  todo.completed ? 'line-through text-gray-500' : ''
                }`}>
                  {todo.title}
                </h3>
                {todo.completed && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Completed
                  </span>
                )}
              </div>
              
              {todo.description && (
                <p className={`mt-1 text-sm text-gray-600 ${
                  todo.completed ? 'line-through text-gray-400' : ''
                }`}>
                  {todo.description}
                </p>
              )}
              
              <div className="flex items-center space-x-3 mt-2">
                {/* Priority Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  getPriorityColor(todo.priority)
                }`}>
                  {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                </span>
                
                {/* Due Date */}
                {todo.due_date && (
                  <span className={`text-xs ${
                    isOverdue(todo.due_date)
                      ? 'text-red-600 font-medium'
                      : todo.completed
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}>
                    {isOverdue(todo.due_date) ? 'Overdue: ' : 'Due: '}
                    {formatDate(todo.due_date)}
                  </span>
                )}
                
                {/* Created Date */}
                <span className="text-xs text-gray-400">
                  Created {formatDate(todo.created_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              {/* Mark complete/active text button */}
              <button
                onClick={() => onToggle(todo.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  todo.completed ? 'text-orange-700 bg-orange-100 hover:bg-orange-200' : 'text-green-700 bg-green-100 hover:bg-green-200'
                }`}
                title={todo.completed ? 'Mark as active' : 'Mark as complete'}
              >
                {todo.completed ? 'Mark as active' : 'Mark as complete'}
              </button>

              <button
                onClick={() => onEdit(todo)}
                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Edit task"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed"
                title="Delete task"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;