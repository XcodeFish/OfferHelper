// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 语音相关类型
export interface VoiceRecordingStatus {
  isRecording: boolean;
  duration?: number;
  volume?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

// AI相关类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// 应用设置类型
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  aiModel: string;
  voiceSettings: {
    inputDevice: string;
    outputDevice: string;
    volume: number;
    autoTranscribe: boolean;
  };
  shortcuts: Record<string, string>;
  windowSettings: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    maximized: boolean;
  };
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 事件类型
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: string;
}
