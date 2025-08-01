import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AppState, AIResponse } from '../../shared/types';

// 定义Store接口
interface AppStore extends AppState {
  // App Actions
  initialize: () => void;
  
  // UI Actions
  setVisible: (visible: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setCurrentView: (view: AppState['ui']['currentView']) => void;
  setTheme: (theme: AppState['ui']['theme']) => void;
  setOpacity: (opacity: number) => void;
  setPosition: (position: { x: number; y: number }) => void;

  // Speech Actions
  startListening: () => void;
  stopListening: () => void;
  setCurrentQuestion: (question: string) => void;
  setInterimResult: (result: string) => void;
  setProcessing: (processing: boolean) => void;

  // AI Actions
  setAnalyzing: (analyzing: boolean) => void;
  setCurrentResponse: (response: AIResponse | null) => void;
  addToHistory: (question: string, response: AIResponse) => void;
  clearHistory: () => void;

  // Privacy Actions
  setHidden: (hidden: boolean) => void;
  setScreenSharingDetected: (detected: boolean) => void;
  setAutoHideEnabled: (enabled: boolean) => void;

  // System Actions
  setOnline: (isOnline: boolean) => void;
  setLastError: (error: string | null) => void;
  updatePerformance: (performance: Partial<AppState['system']['performance']>) => void;
  
  // App Initialization
  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    ui: {
      isVisible: true,
      isMinimized: false,
      currentView: 'main',
      theme: 'dark',
      opacity: 0.9,
      position: { x: 100, y: 100 }
    },
    speech: {
      isListening: false,
      currentQuestion: '',
      interimResult: '',
      isProcessing: false
    },
    ai: {
      isAnalyzing: false,
      currentResponse: null,
      history: []
    },
    privacy: {
      isHidden: false,
      screenSharingDetected: false,
      autoHideEnabled: true
    },
    system: {
      isOnline: true,
      lastError: null,
      performance: {
        memoryUsage: 0,
        cpuUsage: 0
      }
    },

    // App Actions
    initialize: () => {
      console.log('应用状态初始化完成');
    },

    initializeApp: async () => {
      try {
        console.log('开始初始化应用...');
        
        const theme = localStorage.getItem('app-theme') as 'dark' | 'light' || 'dark';
        set((state) => ({
          ui: { ...state.ui, theme }
        }));
        
        document.documentElement.setAttribute('data-theme', theme);
        
        const isOnline = navigator.onLine;
        set((state) => ({
          system: { ...state.system, isOnline }
        }));
        
        console.log('应用初始化完成');
      } catch (error) {
        console.error('应用初始化失败:', error);
        set((state) => ({
          system: { ...state.system, lastError: error instanceof Error ? error.message : '初始化失败' }
        }));
        throw error;
      }
    },

    // UI Actions
    setVisible: (visible) => set((state) => ({
      ui: { ...state.ui, isVisible: visible }
    })),

    setMinimized: (minimized) => set((state) => ({
      ui: { ...state.ui, isMinimized: minimized }
    })),

    setCurrentView: (view) => {
      set((state) => ({
        ui: { ...state.ui, currentView: view }
      }));
    },

    setTheme: (theme) => set((state) => ({
      ui: { ...state.ui, theme }
    })),

    setOpacity: (opacity) => set((state) => ({
      ui: { ...state.ui, opacity }
    })),

    setPosition: (position) => set((state) => ({
      ui: { ...state.ui, position }
    })),

    // Speech Actions
    startListening: () => set((state) => ({
      speech: { ...state.speech, isListening: true }
    })),

    stopListening: () => set((state) => ({
      speech: { ...state.speech, isListening: false, interimResult: '' }
    })),

    setCurrentQuestion: (currentQuestion) => set((state) => ({
      speech: { ...state.speech, currentQuestion }
    })),

    setInterimResult: (interimResult) => set((state) => ({
      speech: { ...state.speech, interimResult }
    })),

    setProcessing: (isProcessing) => set((state) => ({
      speech: { ...state.speech, isProcessing }
    })),

    // AI Actions
    setAnalyzing: (isAnalyzing) => set((state) => ({
      ai: { ...state.ai, isAnalyzing }
    })),

    setCurrentResponse: (currentResponse) => set((state) => ({
      ai: { ...state.ai, currentResponse }
    })),

    addToHistory: (question, response) => set((state) => ({
      ai: {
        ...state.ai,
        history: [
          ...state.ai.history,
          { question, response, timestamp: new Date() }
        ].slice(-50)
      }
    })),

    clearHistory: () => set((state) => ({
      ai: { ...state.ai, history: [] }
    })),

    // Privacy Actions
    setHidden: (isHidden) => set((state) => ({
      privacy: { ...state.privacy, isHidden }
    })),

    setScreenSharingDetected: (screenSharingDetected) => set((state) => ({
      privacy: { ...state.privacy, screenSharingDetected }
    })),

    setAutoHideEnabled: (autoHideEnabled) => set((state) => ({
      privacy: { ...state.privacy, autoHideEnabled }
    })),

    // System Actions
    setOnline: (isOnline) => set((state) => ({
      system: { ...state.system, isOnline }
    })),

    setLastError: (lastError) => set((state) => ({
      system: { ...state.system, lastError }
    })),

    updatePerformance: (performance) => set((state) => ({
      system: {
        ...state.system,
        performance: { ...state.system.performance, ...performance }
      }
    }))

  }))
);

// 状态订阅器
export const useAppSubscriptions = () => {
  const unsubscribePrivacy = useAppStore.subscribe(
    (state) => state.privacy.screenSharingDetected,
    (detected) => {
      if (detected && useAppStore.getState().privacy.autoHideEnabled) {
        useAppStore.getState().setHidden(true);
      }
    }
  );

  const unsubscribeTheme = useAppStore.subscribe(
    (state) => state.ui.theme,
    (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
    }
  );

  const unsubscribeError = useAppStore.subscribe(
    (state) => state.system.lastError,
    (error) => {
      if (error) {
        console.error('应用错误:', error);
      }
    }
  );

  return () => {
    unsubscribePrivacy();
    unsubscribeTheme();
    unsubscribeError();
  };
};