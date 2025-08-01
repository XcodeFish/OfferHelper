/**
 * AI响应接口
 */
export interface AIResponse {
  /** 回答内容 */
  answer: string;
  /** 置信度 (0-1) */
  confidence: number;
  /** 关键词 */
  keywords: string[];
  /** 问题分类 */
  category: string;
  /** 回答建议 */
  suggestions: string[];
  /** 时间戳 */
  timestamp?: number;
}

/**
 * AI配置接口
 */
export interface AIConfig {
  /** AI服务提供商 */
  provider: 'openai' | 'local';
  /** 模型名称 */
  model: string;
  /** 温度参数 */
  temperature: number;
  /** 最大token数 */
  maxTokens: number;
  /** API密钥 */
  apiKey?: string;
  /** API基础URL */
  baseURL?: string;
}

/**
 * AI状态管理接口
 */
export interface AIState {
  isAnalyzing: boolean;
  currentResponse: AIResponse | null;
  history: Array<{
    question: string;
    response: AIResponse;
    timestamp: Date;
  }>;
}

/**
 * AI错误接口
 */
export interface AIError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
}

/**
 * AI事件类型
 */
export interface AIEvents {
  'ai:started': (question: string) => void;
  'ai:completed': (response: AIResponse) => void;
  'ai:error': (error: AIError) => void;
}