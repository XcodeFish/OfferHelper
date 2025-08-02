import React, { useState, useEffect } from 'react';
import { themeManager } from '../utils/theme-manager';
import './settings-page.css';

interface SettingsPageProps {
  onClose: () => void;
}

interface SettingsData {
  // 语音设置
  voiceSettings: {
    inputDevice: string;
    outputDevice: string;
    volume: number;
    sensitivity: number;
    noiseReduction: boolean;
    autoStart: boolean;
  };
  // AI设置
  aiSettings: {
    responseMode: 'simple' | 'normal' | 'detailed';
    language: 'zh-CN' | 'en-US';
    temperature: number;
    maxTokens: number;
  };
  // 界面设置
  uiSettings: {
    theme: 'dark' | 'light' | 'auto';
    opacity: number;
    alwaysOnTop: boolean;
    startMinimized: boolean;
    showInTaskbar: boolean;
  };
  // 快捷键设置
  shortcuts: {
    toggleListening: string;
    hideWindow: string;
    clearContent: string;
    copyAnswer: string;
    switchMode: string;
  };
  // 账户设置
  account: {
    email: string;
    plan: 'free' | 'pro' | 'enterprise';
    usage: {
      requests: number;
      limit: number;
    };
  };
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'ai' | 'ui' | 'shortcuts' | 'account'>('voice');
  const [settings, setSettings] = useState<SettingsData>({
    voiceSettings: {
      inputDevice: 'default',
      outputDevice: 'default',
      volume: 80,
      sensitivity: 70,
      noiseReduction: true,
      autoStart: false,
    },
    aiSettings: {
      responseMode: 'normal',
      language: 'zh-CN',
      temperature: 0.7,
      maxTokens: 1000,
    },
    uiSettings: {
      theme: 'dark',
      opacity: 90,
      alwaysOnTop: false,
      startMinimized: false,
      showInTaskbar: true,
    },
    shortcuts: {
      toggleListening: 'Cmd+Shift+S',
      hideWindow: 'Cmd+Shift+H',
      clearContent: 'Cmd+Shift+C',
      copyAnswer: 'Cmd+Shift+V',
      switchMode: 'Cmd+Shift+M',
    },
    account: {
      email: 'admin@example.com',
      plan: 'free',
      usage: {
        requests: 45,
        limit: 100,
      },
    },
  });

  const [isRecordingShortcut, setIsRecordingShortcut] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<{
    input: Array<{ id: string; name: string }>;
    output: Array<{ id: string; name: string }>;
  }>({
    input: [
      { id: 'default', name: '系统默认' },
      { id: 'mic1', name: '内置麦克风' },
      { id: 'mic2', name: 'USB麦克风' },
    ],
    output: [
      { id: 'default', name: '系统默认' },
      { id: 'speaker1', name: '内置扬声器' },
      { id: 'headphone1', name: '蓝牙耳机' },
    ],
  });

  // 保存设置
  const saveSettings = async () => {
    try {
      if (window.electronAPI?.settings) {
        // 分别保存各个设置模块
        await window.electronAPI.settings.set('voiceSettings', settings.voiceSettings);
        await window.electronAPI.settings.set('aiSettings', settings.aiSettings);
        await window.electronAPI.settings.set('uiSettings', settings.uiSettings);
        await window.electronAPI.settings.set('shortcuts', settings.shortcuts);
        await window.electronAPI.settings.set('account', settings.account);
        
        console.log('设置已保存');
        alert('设置保存成功！');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('设置保存失败：' + (error as Error).message);
    }
  };

  // 加载设置
  const loadSettings = async () => {
    try {
      if (window.electronAPI?.settings) {
        const result = await window.electronAPI.settings.get();
        if (result.success && result.settings) {
          // 确保设置数据结构完整，合并默认值
          const loadedSettings = {
            voiceSettings: {
              inputDevice: 'default',
              outputDevice: 'default',
              volume: 80,
              sensitivity: 70,
              noiseReduction: true,
              autoStart: false,
              ...result.settings.voiceSettings
            },
            aiSettings: {
              responseMode: 'normal' as const,
              language: 'zh-CN' as const,
              temperature: 0.7,
              maxTokens: 1000,
              ...result.settings.aiSettings
            },
            uiSettings: {
              theme: 'dark' as const,
              opacity: 90,
              alwaysOnTop: false,
              startMinimized: false,
              showInTaskbar: true,
              ...result.settings.uiSettings
            },
            shortcuts: {
              toggleListening: 'Cmd+Shift+S',
              hideWindow: 'Cmd+Shift+H',
              clearContent: 'Cmd+Shift+C',
              copyAnswer: 'Cmd+Shift+V',
              switchMode: 'Cmd+Shift+M',
              ...result.settings.shortcuts
            },
            account: {
              email: 'admin@example.com',
              plan: 'free' as const,
              usage: {
                requests: 45,
                limit: 100,
              },
              ...result.settings.account
            }
          };
          
          setSettings(loadedSettings);
          console.log('设置已加载:', loadedSettings);
        }
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  // 重置设置
  const resetSettings = async () => {
    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      try {
        if (window.electronAPI?.settings) {
          const result = await window.electronAPI.settings.reset();
          if (result.success) {
            // 重新加载默认设置
            await loadSettings();
            console.log('设置已重置');
            alert('设置重置成功！');
          } else {
            throw new Error(result.error || '重置失败');
          }
        }
      } catch (error) {
        console.error('重置设置失败:', error);
        alert('设置重置失败：' + (error as Error).message);
      }
    }
  };

  // 录制快捷键
  const recordShortcut = (key: string) => {
    setIsRecordingShortcut(key);
  };

  // 处理快捷键录制
  useEffect(() => {
    if (!isRecordingShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      const keys: string[] = [];
      if (e.metaKey) keys.push('Cmd');
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      
      if (e.key !== 'Meta' && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
        keys.push(e.key.toUpperCase());
      }

      if (keys.length > 1) {
        const shortcut = keys.join('+');
        setSettings(prev => ({
          ...prev,
          shortcuts: {
            ...prev.shortcuts,
            [isRecordingShortcut]: shortcut,
          },
        }));
        setIsRecordingShortcut(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRecordingShortcut]);

  // 组件挂载时加载设置和同步主题状态
  useEffect(() => {
    loadSettings();
    
    // 同步当前主题状态到设置中
    const currentTheme = themeManager.getCurrentTheme();
    setSettings(prev => ({
      ...prev,
      uiSettings: { ...prev.uiSettings, theme: currentTheme }
    }));
  }, []);

  // 渲染语音设置
  const renderVoiceSettings = () => (
    <div className="settings-section">
      <h3>语音识别设置</h3>
      
      <div className="setting-group">
        <label>输入设备</label>
        <select
          value={settings.voiceSettings.inputDevice}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            voiceSettings: { ...prev.voiceSettings, inputDevice: e.target.value }
          }))}
        >
          {availableDevices.input.map(device => (
            <option key={device.id} value={device.id}>{device.name}</option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label>输出设备</label>
        <select
          value={settings.voiceSettings.outputDevice}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            voiceSettings: { ...prev.voiceSettings, outputDevice: e.target.value }
          }))}
        >
          {availableDevices.output.map(device => (
            <option key={device.id} value={device.id}>{device.name}</option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label>灵敏度: {settings.voiceSettings.sensitivity}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.voiceSettings.sensitivity}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            voiceSettings: { ...prev.voiceSettings, sensitivity: parseInt(e.target.value) }
          }))}
        />
      </div>

      <div className="setting-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.voiceSettings.noiseReduction}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              voiceSettings: { ...prev.voiceSettings, noiseReduction: e.target.checked }
            }))}
          />
          启用噪音降噪
        </label>
      </div>

      <div className="setting-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.voiceSettings.autoStart}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              voiceSettings: { ...prev.voiceSettings, autoStart: e.target.checked }
            }))}
          />
          启动时自动开始监听
        </label>
      </div>
    </div>
  );

  // 渲染AI设置
  const renderAISettings = () => (
    <div className="settings-section">
      <h3>AI回答设置</h3>
      
      <div className="setting-group">
        <label>默认回答模式</label>
        <select
          value={settings.aiSettings.responseMode}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            aiSettings: { ...prev.aiSettings, responseMode: e.target.value as 'simple' | 'normal' | 'detailed' }
          }))}
        >
          <option value="simple">精简模式</option>
          <option value="normal">普通模式</option>
          <option value="detailed">详细模式</option>
        </select>
      </div>

      <div className="setting-group">
        <label>语言</label>
        <select
          value={settings.aiSettings.language}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            aiSettings: { ...prev.aiSettings, language: e.target.value as 'zh-CN' | 'en-US' }
          }))}
        >
          <option value="zh-CN">中文</option>
          <option value="en-US">English</option>
        </select>
      </div>

      <div className="setting-group">
        <label>创造性: {settings.aiSettings.temperature}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.aiSettings.temperature}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            aiSettings: { ...prev.aiSettings, temperature: parseFloat(e.target.value) }
          }))}
        />
        <div className="range-labels">
          <span>保守</span>
          <span>创新</span>
        </div>
      </div>

      <div className="setting-group">
        <label>最大回答长度</label>
        <select
          value={settings.aiSettings.maxTokens}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            aiSettings: { ...prev.aiSettings, maxTokens: parseInt(e.target.value) }
          }))}
        >
          <option value="500">短回答 (500字)</option>
          <option value="1000">中等回答 (1000字)</option>
          <option value="2000">长回答 (2000字)</option>
        </select>
      </div>
    </div>
  );

  // 渲染界面设置
  const renderUISettings = () => (
    <div className="settings-section">
      <h3>界面设置</h3>
      
      <div className="setting-group">
        <label>主题</label>
        <select
          value={settings.uiSettings.theme}
          onChange={async (e) => {
            const newTheme = e.target.value as 'dark' | 'light' | 'auto';
            setSettings(prev => ({
              ...prev,
              uiSettings: { ...prev.uiSettings, theme: newTheme }
            }));
            
            // 立即应用主题
            try {
              await themeManager.setTheme(newTheme);
              console.log('主题已切换到:', newTheme);
            } catch (error) {
              console.error('主题切换失败:', error);
            }
          }}
        >
          <option value="dark">深色主题</option>
          <option value="light">浅色主题</option>
          <option value="auto">跟随系统</option>
        </select>
      </div>

      <div className="setting-group">
          <label>窗口透明度: {settings.uiSettings.opacity}%</label>
          <input
            type="range"
            min="10"
            max="100"
            value={settings.uiSettings.opacity}
            onChange={async (e) => {
              const newOpacity = parseInt(e.target.value);
              setSettings(prev => ({
                ...prev,
                uiSettings: { ...prev.uiSettings, opacity: newOpacity }
              }));
              
              // 实时应用透明度设置
              try {
                if (window.electronAPI?.window) {
                  const result = await window.electronAPI.window.setOpacity(newOpacity / 100);
                  if (!result.success) {
                    console.error('设置透明度失败:', result.error);
                  }
                }
              } catch (error) {
                console.error('透明度设置错误:', error);
              }
            }}
          />
      </div>

      <div className="setting-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.uiSettings.alwaysOnTop}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              uiSettings: { ...prev.uiSettings, alwaysOnTop: e.target.checked }
            }))}
          />
          窗口置顶
        </label>
      </div>

      <div className="setting-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.uiSettings.startMinimized}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              uiSettings: { ...prev.uiSettings, startMinimized: e.target.checked }
            }))}
          />
          启动时最小化
        </label>
      </div>

      <div className="setting-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.uiSettings.showInTaskbar}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              uiSettings: { ...prev.uiSettings, showInTaskbar: e.target.checked }
            }))}
          />
          在任务栏显示
        </label>
      </div>
    </div>
  );

  // 渲染快捷键设置
  const renderShortcutSettings = () => (
    <div className="settings-section">
      <h3>快捷键设置</h3>
      
      {Object.entries(settings.shortcuts).map(([key, value]) => (
        <div key={key} className="setting-group shortcut-group">
          <label>
            {key === 'toggleListening' && '开始/停止监听'}
            {key === 'hideWindow' && '隐藏窗口'}
            {key === 'clearContent' && '清除内容'}
            {key === 'copyAnswer' && '复制回答'}
            {key === 'switchMode' && '切换模式'}
          </label>
          <div className="shortcut-input">
            <input
              type="text"
              value={isRecordingShortcut === key ? '按下快捷键...' : value}
              readOnly
              className={isRecordingShortcut === key ? 'recording' : ''}
            />
            <button
              onClick={() => recordShortcut(key)}
              disabled={isRecordingShortcut !== null}
            >
              {isRecordingShortcut === key ? '录制中...' : '修改'}
            </button>
          </div>
        </div>
      ))}
      
      <div className="shortcut-tips">
        <p>💡 提示：点击"修改"按钮后，按下您想要设置的快捷键组合</p>
        <p>⚠️ 建议使用 Cmd/Ctrl + Shift + 字母 的组合避免冲突</p>
      </div>
    </div>
  );

  // 渲染账户设置
  const renderAccountSettings = () => (
    <div className="settings-section">
      <h3>账户信息</h3>
      
      <div className="account-info">
        <div className="account-item">
          <label>邮箱地址</label>
          <span>{settings.account.email}</span>
        </div>
        
        <div className="account-item">
          <label>当前套餐</label>
          <span className={`plan-badge ${settings.account.plan}`}>
            {settings.account.plan === 'free' && '免费版'}
            {settings.account.plan === 'pro' && '专业版'}
            {settings.account.plan === 'enterprise' && '企业版'}
          </span>
        </div>
        
        <div className="account-item">
          <label>本月使用量</label>
          <div className="usage-info">
            <div className="usage-bar">
              <div 
                className="usage-progress"
                style={{ width: `${(settings.account.usage.requests / settings.account.usage.limit) * 100}%` }}
              ></div>
            </div>
            <span>{settings.account.usage.requests} / {settings.account.usage.limit}</span>
          </div>
        </div>
      </div>

      <div className="account-actions">
        <button className="btn-primary">升级套餐</button>
        <button className="btn-secondary">修改密码</button>
        <button className="btn-danger">退出登录</button>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>设置</h2>
        <button 
          className="close-btn" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('关闭按钮被点击');
            onClose();
          }}
        >
          ✕
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <button
              className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              🎤 语音设置
            </button>
            <button
              className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              🤖 AI设置
            </button>
            <button
              className={`nav-item ${activeTab === 'ui' ? 'active' : ''}`}
              onClick={() => setActiveTab('ui')}
            >
              🎨 界面设置
            </button>
            <button
              className={`nav-item ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              ⌨️ 快捷键
            </button>
            <button
              className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              👤 账户
            </button>
          </nav>
        </div>

        <div className="settings-main">
          {activeTab === 'voice' && renderVoiceSettings()}
          {activeTab === 'ai' && renderAISettings()}
          {activeTab === 'ui' && renderUISettings()}
          {activeTab === 'shortcuts' && renderShortcutSettings()}
          {activeTab === 'account' && renderAccountSettings()}
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn-secondary" onClick={resetSettings}>
          重置设置
        </button>
        <div className="footer-actions">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={saveSettings}>
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;