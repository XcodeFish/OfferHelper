    <Provider store={store}>
      <div className="app">
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : showSettings ? (
          <SettingsPage onClose={handleCloseSettings} />
        ) : showVoiceTest ? (
          <VoiceTestSimple onClose={handleCloseVoiceTest} />
        ) : (
          <MainInterface 
            user={user} 
            onLogout={handleLogout} 
            onShowSettings={handleShowSettings}
            onShowVoiceTest={handleShowVoiceTest}
          />
        )}
      </div>
    </Provider>
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import LoginPage from './pages/login-page';
import MainInterface from './components/main-interface';
import SettingsPage from './pages/settings-page';
import VoiceTestSimple from './components/voice-test-simple';
import { themeManager } from './utils/theme-manager';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceTest, setShowVoiceTest] = useState(false);

  // 初始化主题管理器
  useEffect(() => {
    // 主题管理器会自动初始化并应用主题
    // 移除重复的日志打印，因为主题管理器内部已经有日志
    themeManager; // 确保主题管理器被初始化
  }, []);

  const handleLogin = async (email: string) => {
    setIsLoggedIn(true);
    setUser({ email });
    
    // 调整窗口大小为主界面尺寸
    try {
      if (window.electronAPI?.window?.resize) {
        await window.electronAPI.window.resize(400, 340);
      }
    } catch (error) {
      console.error('调整窗口大小失败:', error);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setUser(null);
    setShowSettings(false);
    setShowVoiceTest(false);
    
    // 调整窗口大小为登录界面尺寸
    try {
      if (window.electronAPI?.window?.resize) {
        await window.electronAPI.window.resize(480, 600);
      }
    } catch (error) {
      console.error('调整窗口大小失败:', error);
    }
  };

  const handleShowSettings = async () => {
    setShowSettings(true);
    
    // 调整窗口大小为设置页面尺寸
    try {
      if (window.electronAPI?.window?.resize) {
        await window.electronAPI.window.resize(600, 500);
      }
    } catch (error) {
      console.error('调整窗口大小失败:', error);
    }
  };

  const handleCloseSettings = async () => {
    setShowSettings(false);
    
    // 调整窗口大小回到主界面尺寸
    try {
      if (window.electronAPI?.window?.resize) {
        await window.electronAPI.window.resize(400, 340);
      }
    } catch (error) {
      console.error('调整窗口大小失败:', error);
    }
  };

  const handleShowVoiceTest = () => {
    setShowVoiceTest(true);
  };

  const handleCloseVoiceTest = () => {
    setShowVoiceTest(false);
  };

  return (
    <Provider store={store}>
      <div className="app">
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : showSettings ? (
          <SettingsPage onClose={handleCloseSettings} />
        ) : showVoiceTest ? (
          <VoiceTestSimple onClose={handleCloseVoiceTest} />
        ) : (
          <MainInterface 
            user={user} 
            onLogout={handleLogout} 
            onShowSettings={handleShowSettings}
            onShowVoiceTest={handleShowVoiceTest}
          />
        )}
      </div>
    </Provider>
  );
};

export default App;
=======
    <Provider store={store}>
      <div className="app">
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : showSettings ? (
          <SettingsPage onClose={handleCloseSettings} />
        ) : showVoiceTest ? (
          <VoiceTestSimple onClose={handleCloseVoiceTest} />
        ) : (
          <MainInterface 
            user={user} 
            onLogout={handleLogout} 
            onShowSettings={handleShowSettings}
            onShowVoiceTest={handleShowVoiceTest}
          />
        )}
      </div>
    </Provider>
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
  );
};

export default App;