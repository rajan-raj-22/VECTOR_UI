
import React from 'react';
import { FileText, Video, Image, FileSpreadsheet } from 'lucide-react';

interface ContentTypeButtonProps {
  contentType: string;
  onClick: (contentType: string) => void;
}

const ContentTypeButton = ({ contentType, onClick }: ContentTypeButtonProps) => {
  const getIcon = () => {
    switch (contentType) {
      case 'Text':
        return <FileText className="w-5 h-5" />;
      case 'Audio, Video & Image':
        return <Video className="w-5 h-5" />;
      case 'Documents':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'Presentations':
        return <Image className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <button
      onClick={() => onClick(contentType)}
      className="w-full flex items-center space-x-3 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300"
    >
      {getIcon()}
      <span>{contentType}</span>
    </button>
  );
};

export default ContentTypeButton;
