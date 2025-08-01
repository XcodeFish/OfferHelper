// 导出所有类型定义
export * from './window';
export * from './speech';
export * from './ai';
export * from './electron';

// 先导入类型
import type { SpeechState } from './speech';
import type { AIState } from './ai';

// 应用状态类型
export interface AppState {
  ui: UIState;
  speech: SpeechState;
  ai: AIState;
  privacy: PrivacyState;
  system: SystemState;
}

export interface UIState {
  isVisible: boolean;
  isMinimized: boolean;
  currentView: 'main' | 'settings' | 'knowledge';
  theme: 'dark' | 'light';
  opacity: number;
  position: { x: number; y: number };
}

export interface PrivacyState {
  isHidden: boolean;
  screenSharingDetected: boolean;
  autoHideEnabled: boolean;
}

export interface SystemState {
  isOnline: boolean;
  lastError: string | null;
  performance: {
    memoryUsage: number;
    cpuUsage: number;
  };
}

// 重新导出语音和AI状态
export type { SpeechState } from './speech';
export type { AIState } from './ai';