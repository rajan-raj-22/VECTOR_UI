
import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  type?: 'text' | 'topic-selection' | 'content-selection';
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-2 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-green-500 text-white rounded-br-md'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
          } transform transition-all duration-200 hover:scale-[1.02]`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
          <div className={`flex items-center justify-end mt-1 space-x-1 ${isUser ? 'text-green-100' : 'text-gray-500'}`}>
            <span className="text-xs">{message.timestamp}</span>
            {isUser && (
              <CheckCheck className="w-4 h-4 text-green-100" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
