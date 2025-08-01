/**
 * 语音识别配置接口
 */
export interface SpeechConfig {
  /** 识别语言 */
  language: string;
  /** 是否连续识别 */
  continuous: boolean;
  /** 是否返回中间结果 */
  interimResults: boolean;
  /** 最大候选结果数量 */
  maxAlternatives: number;
}

/**
 * 语音识别结果接口
 */
export interface SpeechResult {
  /** 识别的文本内容 */
  transcript: string;
  /** 置信度 (0-1) */
  confidence: number;
  /** 是否为最终结果 */
  isFinal: boolean;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 语音识别错误接口
 */
export interface SpeechError {
  /** 错误类型 */
  error: string;
  /** 错误消息 */
  message: string;
}

/**
 * 语音识别状态
 */
export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'error';

/**
 * 语音识别状态管理接口
 */
export interface SpeechState {
  isListening: boolean;
  currentQuestion: string;
  interimResult: string;
  isProcessing: boolean;
}

/**
 * 语音识别事件类型
 */
export interface SpeechEvents {
  'speech:started': () => void;
  'speech:ended': () => void;
  'speech:result': (result: SpeechResult) => void;
  'speech:interim': (result: SpeechResult) => void;
  'speech:error': (error: SpeechError) => void;
}