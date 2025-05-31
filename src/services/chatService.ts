// Chat service for backend integration with LangChain Python API

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  type?: string;
}

export interface ChatRequest {
  message: string;
  topic?: string;
  contentType?: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  type?: string;
  options?: string[];
  sessionId: string;
}

class ChatService {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor() {
    // Replace with your LangChain backend URL
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      // Store session ID for conversation continuity
      if (data.sessionId) {
        this.sessionId = data.sessionId;
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback response for development
      return {
        message: 'I apologize, but I\'m having trouble connecting to the server. Please try again later.',
        sessionId: this.sessionId || 'local-session',
      };
    }
  }

  async generateContent(topic: string, contentType: string, prompt: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          contentType,
          prompt,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating content:', error);
      return {
        message: 'Content generation is currently unavailable. Please try again later.',
        sessionId: this.sessionId || 'local-session',
      };
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  resetSession(): void {
    this.sessionId = null;
  }
}

export const chatService = new ChatService();
