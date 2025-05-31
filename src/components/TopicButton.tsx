
import React from 'react';

interface TopicButtonProps {
  topic: string;
  onClick: (topic: string) => void;
}

const TopicButton = ({ topic, onClick }: TopicButtonProps) => {
  return (
    <button
      onClick={() => onClick(topic)}
      className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300"
    >
      {topic}
    </button>
  );
};

export default TopicButton;
