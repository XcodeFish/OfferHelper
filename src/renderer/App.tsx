import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import TitleBar from './components/layout/TitleBar';
import StatusBar from './components/layout/StatusBar';
import MainLayout from './components/layout/MainLayout';
import { MainContent } from './components/layout/MainContent';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ControlPanel } from './components/layout/ControlPanel';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    initializeApp, 
    ui
  } = useAppStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeApp();
        setIsLoading(false);
      } catch (err) {
        console.error('应用初始化失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
        setIsLoading(false);
      }
    };

    initApp();
  }, [initializeApp]);

  // 应用主题类名
  const themeClass = ui.theme === 'dark' ? 'theme-dark' : 'theme-light';

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>应用启动失败</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`app-container ${themeClass}`}>
        <motion.div
          className="app-wrapper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* 标题栏 */}
          <TitleBar title="OfferHelper" />

          {/* 状态栏 */}
          <StatusBar 
            status="idle" 
            isOnline={true}
          />

          {/* 主内容区 */}
          <div className="content-wrapper">
            <MainContent />
          </div>

          {/* 控制面板 */}
          <ControlPanel />
        </motion.div>
      </div>
    </ErrorBoundary>
  );
};

export default App;