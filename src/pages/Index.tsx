import React from 'react';
import { Link } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';

const Index = () => {
  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <Link 
          to="/document-processor" 
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          Document Processor
        </Link>
      </div>
      <ChatInterface />
    </div>
  );
};

export default Index;
