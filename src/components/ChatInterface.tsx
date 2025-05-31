import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TopicButton from './TopicButton';
import ContentTypeButton from './ContentTypeButton';
import { uploadDocument, queryDocument } from '../services/api';

interface SearchResult {
  content: string;
  section: string;
  relevance_score: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  type?: 'text' | 'topic-selection' | 'content-selection' | 'file' | 'search-result';
  options?: string[];
  fileName?: string;
  searchResults?: SearchResult[];
}

// New component for displaying search results
const SearchResultDisplay: React.FC<{ result: SearchResult }> = ({ result }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-2">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold text-green-600">{result.section}</span>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          {result.relevance_score}
        </span>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{result.content}</p>
    </div>
  );
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome! Please upload a document to get started.',
      sender: 'ai',
      timestamp: '11:28 AM',
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentFlow, setCurrentFlow] = useState<'upload' | 'chat'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'ai', type?: string, fileName?: string, searchResults?: SearchResult[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: type as any,
      fileName,
      searchResults
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    addMessage(`Uploading document: ${file.name}`, 'user', 'file', file.name);

    try {
      await uploadDocument(file);
      addMessage('Document uploaded successfully! You can now ask questions about it.', 'ai');
      setCurrentFlow('chat');
      setHasDocument(true);
      setIsProcessing(false);
      // Focus the input after successful upload
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      addMessage('Error uploading document. Please try again.', 'ai');
      setCurrentFlow('upload');
      setHasDocument(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSearchResults = (results: any[]): SearchResult[] => {
    return results.map(result => ({
      section: result.section || 'General Content',
      content: result.content.trim(),
      relevance_score: result.relevance_score
    }));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !hasDocument) return;
    
    const userQuery = inputValue;
    addMessage(userQuery, 'user');
    setInputValue('');
    setIsProcessing(true);
    
    try {
      const response = await queryDocument(userQuery);
      if (Array.isArray(response.results)) {
        const formattedResults = formatSearchResults(response.results);
        addMessage('Here are the relevant sections from the document:', 'ai', 'search-result', undefined, formattedResults);
      } else {
        addMessage(response.results || 'No matching content found', 'ai');
      }
    } catch (error) {
      console.error('Query error:', error);
      let errorMessage = 'Error processing your query. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      }
      addMessage(errorMessage, 'ai');
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachmentClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <ArrowLeft className="w-6 h-6 cursor-pointer hover:bg-green-600 rounded-full p-1 transition-colors" />
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-lg">AI</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Document Assistant</h2>
              <p className="text-green-100 text-sm">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-green-50 to-gray-50">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt,.docx"
          />
          <Paperclip 
            onClick={handleAttachmentClick}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              isProcessing ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ pointerEvents: isProcessing ? 'none' : 'auto' }}
          />
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={!hasDocument ? "Upload a document to get started..." : "Ask a question about your document..."}
              className={`w-full px-4 py-3 rounded-full border focus:outline-none transition-all ${
                hasDocument && !isProcessing
                  ? 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100'
                  : 'border-gray-200 bg-gray-50'
              }`}
              disabled={!hasDocument || isProcessing}
              aria-label="Message input"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing || !hasDocument}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              !inputValue.trim() || isProcessing || !hasDocument
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
