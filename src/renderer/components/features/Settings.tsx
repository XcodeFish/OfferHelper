import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store';
import { speechService } from '../../services/SpeechService';
import { tencentSpeechService } from '../../services/TencentSpeechService';
import { testSpeechService, validateTencentConfig, cleanupSpeechService } from '../../utils/speechUtils';
import { debugLogger } from '../../utils/debugLogger';
import NoEventBusTest from './NoEventBusTest';
import EventBusTest from './EventBusTest';
import ProgressiveSpeechTest from './ProgressiveSpeechTest';
import ImprovedSpeechMonitor from './ImprovedSpeechMonitor';
import TimingAnalysisTest from './TimingAnalysisTest';
import UltimateSpeechDebugger from './UltimateSpeechDebugger';
import SafeSpeechTest from './SafeSpeechTest';

// 检测是否在 Electron 环境中运行
const isElectron = typeof window !== 'undefined' && window.electron;

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { ui, privacy, setTheme, setAutoHideEnabled } = useAppStore();
  
  // 记录组件挂载
  useEffect(() => {
    debugLogger.trackComponentLifecycle('Settings', 'mounted');
    return () => {
      debugLogger.trackComponentLifecycle('Settings', 'unmounting');
    };
  }, []);
  
  // 本地状态
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
  const [language, setLanguage] = useState('zh-CN');
  const [autoStart, setAutoStart] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hotkey, setHotkey] = useState('Cmd+Shift+H');
  const [windowOpacity, setWindowOpacity] = useState(0.9);
  const [fontSize, setFontSize] = useState('medium');
  const [maxHistory, setMaxHistory] = useState(50);
  
  // 腾讯云语音识别配置
  const [tencentSecretId, setTencentSecretId] = useState('');
  const [tencentSecretKey, setTencentSecretKey] = useState('');
  const [tencentAppId, setTencentAppId] = useState('');
  const [tencentRegion, setTencentRegion] = useState('ap-beijing');
  const [speechEngine, setSpeechEngine] = useState('16k_zh');
  const [voiceFormat, setVoiceFormat] = useState('pcm');
  const [speechProvider, setSpeechProvider] = useState('tencent'); // 'tencent' 或 'browser'
  const [showNoEventBusTest, setShowNoEventBusTest] = useState(false);
  const [showEventBusTest, setShowEventBusTest] = useState(false);
  const [showProgressiveTest, setShowProgressiveTest] = useState(false);
  const [showImprovedMonitor, setShowImprovedMonitor] = useState(false);
  const [showTimingAnalysis, setShowTimingAnalysis] = useState(false);
  const [showUltimateDebugger, setShowUltimateDebugger] = useState(false);
  const [showSafeSpeechTest, setShowSafeSpeechTest] = useState(false);

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setApiKey(settings.apiKey || '');
      setAiModel(settings.aiModel || 'gpt-3.5-turbo');
      setLanguage(settings.language || 'zh-CN');
      setAutoStart(settings.autoStart || false);
      setNotifications(settings.notifications !== false);
      setSoundEnabled(settings.soundEnabled !== false);
      setHotkey(settings.hotkey || 'Cmd+Shift+H');
      setWindowOpacity(settings.windowOpacity || 0.9);
      setFontSize(settings.fontSize || 'medium');
      setMaxHistory(settings.maxHistory || 50);
      
      // 腾讯云语音识别配置
      setTencentSecretId(settings.tencentSecretId || '');
      setTencentSecretKey(settings.tencentSecretKey || '');
      setTencentAppId(settings.tencentAppId || '');
      setTencentRegion(settings.tencentRegion || 'ap-beijing');
      setSpeechEngine(settings.speechEngine || '16k_zh');
      setVoiceFormat(settings.voiceFormat || 'pcm');
      setSpeechProvider(settings.speechProvider || 'tencent');
    }
  }, []);

  // 初始化语音识别服务
  useEffect(() => {
    // 当配置变更时，初始化对应的语音识别服务
    const initSpeechService = async () => {
      try {
        if (speechProvider === 'tencent' && tencentSecretId && tencentSecretKey) {
          // 在网页版中，腾讯云语音识别功能受限，提示用户使用 Electron 版本
          if (!isElectron) {
            console.log('网页版使用 TencentWebSpeechService 支持腾讯云语音识别');
            // 网页版也支持腾讯云语音识别
            // 网页版现在也支持腾讯云语音识别，不需要强制切换
            console.log('网页版继续使用腾讯云语音识别');
          }
          
          // 初始化腾讯云语音识别服务
          const voiceFormatMap: Record<string, number> = {
            'pcm': 1,
            'wav': 12,
            'mp3': 8,
            'flac': 12
          };
          
          await tencentSpeechService.initialize({
            secretId: tencentSecretId,
            secretKey: tencentSecretKey,
            appId: tencentAppId,
            region: tencentRegion,
            engineType: speechEngine,
            voiceFormat: voiceFormatMap[voiceFormat] || 1,
            needVad: 1,
            hotwordId: '',
            filterDirty: 0,
            filterModal: 0,
            filterPunc: 0,
            convertNumMode: 1,
            filterEmptyResult: 1,
            vadSilenceTime: 1000
          });
          
          // 更新全局语音服务
          speechService.setProvider('tencent');
          console.log('腾讯云语音识别服务初始化成功');
        } else if (speechProvider === 'browser') {
          // 使用浏览器内置语音识别
          speechService.setProvider('browser');
          console.log('浏览器语音识别服务初始化成功');
        }
      } catch (error) {
        console.error('初始化语音识别服务失败:', error);
        // 在网页版中如果腾讯云服务失败，自动切换到浏览器内置识别
        if (!isElectron && speechProvider === 'tencent') {
          console.log('自动切换到浏览器内置语音识别');
          setSpeechProvider('browser');
          speechService.setProvider('browser');
        }
      }
    };
    
    initSpeechService();
  }, [speechProvider, tencentSecretId, tencentSecretKey, tencentRegion, speechEngine, voiceFormat]);

  // 保存设置到本地存储
  const saveSettings = async () => {
    const settings = {
      apiKey,
      aiModel,
      language,
      autoStart,
      notifications,
      soundEnabled,
      hotkey,
      windowOpacity,
      fontSize,
      maxHistory,
      
      // 腾讯云语音识别配置
      tencentSecretId,
      tencentSecretKey,
      tencentAppId,
      tencentRegion,
      speechEngine,
      voiceFormat,
      speechProvider
    };
    localStorage.setItem('app-settings', JSON.stringify(settings));
    
    // 初始化语音识别服务
    if (speechProvider === 'tencent' && tencentSecretId && tencentSecretKey) {
      // 在网页版中，腾讯云语音识别功能受限
      if (!isElectron) {
            console.log('网页版使用 TencentWebSpeechService 保存腾讯云配置');
            // 网页版也支持腾讯云语音识别配置更新
      }
      
      const voiceFormatMap: Record<string, number> = {
        'pcm': 1,
        'wav': 12,
        'mp3': 8,
        'flac': 12
      };
      
      try {
        await tencentSpeechService.updateConfig({
          secretId: tencentSecretId,
          secretKey: tencentSecretKey,
          appId: tencentAppId,
          region: tencentRegion,
          engineType: speechEngine,
          voiceFormat: voiceFormatMap[voiceFormat] || 1,
          needVad: 1,
          hotwordId: '',
          filterDirty: 0,
          filterModal: 0,
          filterPunc: 0,
          convertNumMode: 1,
          filterEmptyResult: 1,
          vadSilenceTime: 1000
        });
      } catch (error) {
        console.error('更新腾讯云语音识别配置失败:', error);
      }
    }
    
    // 显示保存成功提示
    console.log('设置已保存');
    alert('设置已保存成功！');
  };

  // 重置设置
  const resetSettings = () => {
    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      localStorage.removeItem('app-settings');
      setApiKey('');
      setAiModel('gpt-3.5-turbo');
      setLanguage('zh-CN');
      setAutoStart(false);
      setNotifications(true);
      setSoundEnabled(true);
      setHotkey('Cmd+Shift+H');
      setWindowOpacity(0.9);
      setFontSize('medium');
      setMaxHistory(50);
      setTheme('dark');
      setAutoHideEnabled(false);
      
      // 重置腾讯云语音识别配置
      setTencentSecretId('');
      setTencentSecretKey('');
      setTencentAppId('');
      setTencentRegion('ap-beijing');
      setSpeechEngine('16k_zh');
      setVoiceFormat('pcm');
      setSpeechProvider('tencent');
    }
  };

  return (
    <motion.div
      className="settings-container h-full flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="返回主界面"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-white">⚙️ 设置</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            保存设置
          </button>
          <button
            onClick={resetSettings}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        
        {/* 外观设置 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🎨 外观设置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-300">主题模式</label>
              <select
                value={ui.theme}
                onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="dark">深色主题</option>
                <option value="light">浅色主题</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-gray-300">字体大小</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300">窗口透明度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.1"
                  value={windowOpacity}
                  onChange={(e) => setWindowOpacity(parseFloat(e.target.value))}
                  className="w-24"
                />
                <span className="text-gray-400 text-sm w-8">{Math.round(windowOpacity * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI 配置 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🧠 AI 配置
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">OpenAI API 密钥</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入您的 OpenAI API 密钥"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
              />
              <p className="text-gray-500 text-xs mt-1">
                API 密钥将安全存储在本地，不会上传到服务器
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300">AI 模型</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (推荐)</option>
                <option value="gpt-4">GPT-4 (更强但较慢)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300">历史记录上限</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={maxHistory}
                  onChange={(e) => setMaxHistory(parseInt(e.target.value))}
                  className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
                <span className="text-gray-400 text-sm">条</span>
              </div>
            </div>
          </div>
        </div>

        {/* 语音识别配置 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🎤 语音识别配置
          </h3>
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  console.log('🎤 启动实时语音测试');
                  setShowSafeSpeechTest(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2 font-medium"
              >
                <span>🎤</span> 实时语音测试
              </button>
            </div>
            
            {/* 调试测试按钮（可折叠） */}
            <details className="mt-2">
              <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-300">
                🔧 高级调试工具 (开发用)
              </summary>
              <div className="flex justify-end gap-1 mt-2 flex-wrap">
                <button
                  onClick={() => {
                    console.log('🎤 启动改进版语音测试');
                    setShowImprovedMonitor(true);
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                >
                  🎤 改进版
                </button>
                
                <button
                  onClick={() => {
                    console.log('🔬 启动终极调试器');
                    setShowUltimateDebugger(true);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                >
                  🔬 终极调试
                </button>
                
                <button
                  onClick={() => setShowTimingAnalysis(true)}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                >
                  ⏱️ 时序分析
                </button>
                
                <button
                  onClick={() => setShowNoEventBusTest(true)}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                >
                  🧪 基础
                </button>
                
                <button
                  onClick={() => setShowEventBusTest(true)}
                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs transition-colors"
                >
                  ⚡ EventBus
                </button>
                
                <button
                  onClick={() => setShowProgressiveTest(true)}
                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs transition-colors"
                >
                  🔍 渐进式
                </button>
              </div>
            </details>
            <div className="flex items-center justify-between">
              <label className="text-gray-300">语音识别服务</label>
              <select
                value={speechProvider}
                onChange={(e) => setSpeechProvider(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="tencent">
                  腾讯云语音识别
                </option>
                <option value="browser">浏览器内置识别</option>
              </select>
            </div>

            {!isElectron && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400 text-sm">⚠️</span>
                  <div className="text-sm text-yellow-300">
                    <p className="font-medium mb-1">网页版功能限制：</p>
                    <ul className="text-xs space-y-1 text-yellow-200">
                      <li>• 腾讯云语音识别提供更高的识别准确率</li>
                      <li>• 浏览器内置识别无需配置，开箱即用</li>
                      <li>• 建议根据使用场景选择合适的识别服务</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {speechProvider === 'tencent' && (
              <>
                {/* 配置状态提示 */}
                {(!tencentSecretId || !tencentSecretKey || !tencentAppId) && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-400 text-sm">⚠️</span>
                      <div className="text-sm text-red-300">
                        <p className="font-medium mb-1">腾讯云配置不完整</p>
                        <p className="text-xs text-red-200">
                          请完整填写 SecretId、SecretKey 和 AppId 才能使用腾讯云语音识别服务。
                          <br />
                          您可以在 <a href="https://console.cloud.tencent.com/cam/capi" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">腾讯云控制台</a> 获取这些信息。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-2">
                    腾讯云 SecretId
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="password"
                    value={tencentSecretId}
                    onChange={(e) => setTencentSecretId(e.target.value)}
                    placeholder="输入您的腾讯云 SecretId"
                    className={`w-full border rounded-lg px-3 py-2 text-white placeholder-gray-400 ${
                      !tencentSecretId ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-700 border-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    腾讯云 SecretKey
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="password"
                    value={tencentSecretKey}
                    onChange={(e) => setTencentSecretKey(e.target.value)}
                    placeholder="输入您的腾讯云 SecretKey"
                    className={`w-full border rounded-lg px-3 py-2 text-white placeholder-gray-400 ${
                      !tencentSecretKey ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-700 border-gray-600'
                    }`}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    密钥将安全存储在本地，用于调用腾讯云语音识别服务
                  </p>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">
                    腾讯云 AppId
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={tencentAppId}
                    onChange={(e) => setTencentAppId(e.target.value)}
                    placeholder="输入您的腾讯云 AppId (例如: 1234567890)"
                    className={`w-full border rounded-lg px-3 py-2 text-white placeholder-gray-400 ${
                      !tencentAppId ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-700 border-gray-600'
                    }`}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    AppId 是一个数字，可在腾讯云控制台的应用管理中找到
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-gray-300">服务地域</label>
                  <select
                    value={tencentRegion}
                    onChange={(e) => setTencentRegion(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="ap-beijing">北京</option>
                    <option value="ap-shanghai">上海</option>
                    <option value="ap-guangzhou">广州</option>
                    <option value="ap-chengdu">成都</option>
                    <option value="ap-nanjing">南京</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-gray-300">识别引擎</label>
                  <select
                    value={speechEngine}
                    onChange={(e) => setSpeechEngine(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="16k_zh">16k 中文普通话通用</option>
                    <option value="16k_zh_video">16k 音视频领域</option>
                    <option value="16k_en">16k 英语</option>
                    <option value="8k_zh">8k 中文普通话通用</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-gray-300">音频格式</label>
                  <select
                    value={voiceFormat}
                    onChange={(e) => setVoiceFormat(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="pcm">PCM (推荐)</option>
                    <option value="wav">WAV</option>
                    <option value="mp3">MP3</option>
                    <option value="flac">FLAC</option>
                  </select>
                </div>
              </>
            )}

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-sm">💡</span>
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">语音识别服务说明：</p>
                  <ul className="text-xs space-y-1 text-blue-200">
                    <li>• 腾讯云：更高精度，支持专业术语，需要API密钥</li>
                    <li>• 浏览器内置：免费使用，但精度相对较低</li>
                    <li>• 建议面试场景使用腾讯云服务以获得更好效果</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 隐私保护 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🔒 隐私保护
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-300">自动隐藏检测</label>
                <p className="text-gray-500 text-sm">检测到屏幕共享时自动隐藏窗口</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.autoHideEnabled}
                  onChange={(e) => setAutoHideEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-300">数据加密</label>
                <p className="text-gray-500 text-sm">本地数据使用 AES 加密存储</p>
              </div>
              <span className="text-green-400 text-sm">✓ 已启用</span>
            </div>
          </div>
        </div>

        {/* 系统设置 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            ⚙️ 系统设置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-300">语言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-300">开机自启动</label>
                <p className="text-gray-500 text-sm">系统启动时自动运行应用</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-300">系统通知</label>
                <p className="text-gray-500 text-sm">接收应用通知消息</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-300">声音提示</label>
                <p className="text-gray-500 text-sm">播放操作提示音</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300">快捷键</label>
              <input
                type="text"
                value={hotkey}
                onChange={(e) => setHotkey(e.target.value)}
                placeholder="Cmd+Shift+H"
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white w-32"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 无EventBus测试弹窗 */}
        {showNoEventBusTest && (
          <NoEventBusTest
            visible={showNoEventBusTest}
            onClose={() => setShowNoEventBusTest(false)}
          />
        )}
        
      {/* EventBus测试弹窗 */}
        {showEventBusTest && (
          <EventBusTest
            visible={showEventBusTest}
            onClose={() => setShowEventBusTest(false)}
          />
        )}
        
      {/* 渐进式测试弹窗 */}
        {showProgressiveTest && (
          <ProgressiveSpeechTest
            visible={showProgressiveTest}
            onClose={() => setShowProgressiveTest(false)}
          />
        )}
        
      {/* 改进版语音测试弹窗 */}
        {showImprovedMonitor && (
          <ImprovedSpeechMonitor
            visible={showImprovedMonitor}
            onClose={() => setShowImprovedMonitor(false)}
            provider={speechProvider as 'browser' | 'tencent'}
          />
        )}
        
      {/* 时序分析测试弹窗 */}
        {showTimingAnalysis && (
          <TimingAnalysisTest
            visible={showTimingAnalysis}
            onClose={() => setShowTimingAnalysis(false)}
          />
        )}
        
      {/* 终极调试器弹窗 */}
        {showUltimateDebugger && (
          <UltimateSpeechDebugger
            visible={showUltimateDebugger}
            onClose={() => setShowUltimateDebugger(false)}
          />
        )}
        
      {/* 安全版语音测试弹窗 */}
        {showSafeSpeechTest && (
          <SafeSpeechTest
            visible={showSafeSpeechTest}
            onClose={() => setShowSafeSpeechTest(false)}
          />
        )}
    </motion.div>
  );
};

export default Settings;
