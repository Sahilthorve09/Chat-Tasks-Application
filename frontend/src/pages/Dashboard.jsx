import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatSection from '../components/ChatSection';
import TodoSection from '../components/TodoSection';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('chat');
  const { user } = useAuth();

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'chat':
        return <ChatSection />;
      case 'todos':
        return <TodoSection />;
      default:
        return <ChatSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600">
            {activeSection === 'chat' 
              ? 'Chat with other users in real-time' 
              : 'Manage your tasks and stay organized'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-200px)]">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;