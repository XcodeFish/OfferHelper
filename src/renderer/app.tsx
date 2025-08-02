import React, { useState, useEffect } from 'react';
import LoginPage from './pages/login-page';
import MainInterface from './components/main-interface';
import SettingsPage from './pages/settings-page';
import { themeManager } from './utils/theme-manager';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 初始化主题管理器
  useEffect(() => {
    const initTheme = async () => {
      try {
        // 主题管理器会自动初始化并应用主题
        console.log('主题管理器已初始化');
      } catch (error) {
        console.error('主题初始化失败:', error);
      }
    };

    initTheme();
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

  return (
    <div className="app">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : showSettings ? (
        <SettingsPage onClose={handleCloseSettings} />
      ) : (
        <MainInterface 
          user={user} 
          onLogout={handleLogout} 
          onShowSettings={handleShowSettings}
        />
      )}
    </div>
  );
};

export default App;