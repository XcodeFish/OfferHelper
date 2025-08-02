import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { speechService } from '../../services/SpeechService';
import { EventBus } from '../../../shared/utils/EventBus';

interface SafeSpeechTestProps {
  visible: boolean;
  onClose: () => void;
}

const SafeSpeechTest: React.FC<SafeSpeechTestProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('就绪');
  const [speechResults, setSpeechResults] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [autoStopTimer, setAutoStopTimer] = useState<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 设置EventBus监听器
  useEffect(() => {
    if (!visible) return;

    const handleSpeechResult = (result: any) => {
      addLog(`🎯 识别结果: "${result.transcript}" (置信度: ${result.confidence.toFixed(2)})`, 'success');
      if (result.isFinal) {
        setSpeechResults(prev => [...prev, result.transcript]);
        setCurrentTranscript('');
      } else {
        setCurrentTranscript(result.transcript);
      }
    };

    const handleSpeechError = (error: any) => {
      addLog(`❌ 识别错误: ${error.message}`, 'error');
    };

    const handleSpeechStarted = () => {
      addLog('🎤 语音识别已开始监听', 'info');
      setStatus('正在监听...');
    };

    const handleSpeechEnded = () => {
      addLog('🔚 语音识别已结束', 'info');
      setStatus('识别结束');
    };

    EventBus.on('speech:result', handleSpeechResult);
    EventBus.on('speech:error', handleSpeechError);
    EventBus.on('speech:started', handleSpeechStarted);
    EventBus.on('speech:ended', handleSpeechEnded);

    return () => {
      EventBus.off('speech:result', handleSpeechResult);
      EventBus.off('speech:error', handleSpeechError);
      EventBus.off('speech:started', handleSpeechStarted);
      EventBus.off('speech:ended', handleSpeechEnded);
      
      // 清理定时器
      if (autoStopTimer) {
        clearTimeout(autoStopTimer);
      }
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const now = Date.now();
    const timeStr = startTimeRef.current ? `+${now - startTimeRef.current}ms` : new Date().toLocaleTimeString();
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    const logMessage = `[${timeStr}] ${emoji} ${message}`;
    
    console.log(`[SafeSpeechTest] ${logMessage}`);
    setLogs(prev => [...prev.slice(-30), logMessage]);
  };

  const clearLogs = () => {
    setLogs([]);
    setSpeechResults([]);
    setCurrentTranscript('');
    startTimeRef.current = 0;
  };

  const stopSpeechRecognition = () => {
    try {
      if (autoStopTimer) {
        clearTimeout(autoStopTimer);
        setAutoStopTimer(null);
      }
      speechService.stopListening();
      addLog('✅ 语音识别已手动停止', 'success');
      setStatus('已停止');
      setIsActive(false);
    } catch (error: any) {
      addLog(`❌ 停止失败: ${error.message}`, 'error');
      setStatus('停止失败');
      setIsActive(false);
    }
  };

  const testSafeTencentSpeech = async () => {
    startTimeRef.current = Date.now();
    setIsActive(true);
    setStatus('测试中...');
    addLog('🛡️ 开始安全版腾讯云语音识别测试', 'info');

    try {
      // 从localStorage获取腾讯云配置
      const savedSettings = localStorage.getItem('app-settings');
      if (!savedSettings) {
        throw new Error('未找到保存的设置');
      }

      const settings = JSON.parse(savedSettings);
      const { tencentSecretId, tencentSecretKey, tencentAppId, tencentRegion } = settings;

      if (!tencentSecretId || !tencentSecretKey || !tencentAppId) {
        throw new Error('腾讯云配置不完整');
      }

      addLog('步骤1: 配置腾讯云参数');
      const config = {
        secretId: tencentSecretId,
        secretKey: tencentSecretKey,
        appId: tencentAppId,
        region: tencentRegion || 'ap-beijing',
        engineType: '16k_zh',
        voiceFormat: 1,
        needVad: 1,
        hotwordId: '',
        filterDirty: 0,
        filterModal: 0,
        filterPunc: 0,
        convertNumMode: 1,
        filterEmptyResult: 1,
        vadSilenceTime: 1000
      };

      addLog('步骤2: 设置语音服务提供商为腾讯云');
      speechService.setProvider('tencent');
      speechService.setTencentConfig(config);

      addLog('步骤3: 启动语音识别');
      await speechService.startListening();
      addLog('✅ 语音识别启动成功', 'success');
      setStatus('正在识别...');

      // 设置5分钟的安全超时，防止长时间运行
      const timer = setTimeout(() => {
        try {
          speechService.stopListening();
          addLog('⏰ 语音识别已自动停止（5分钟超时）', 'warning');
          setStatus('自动停止');
          setIsActive(false);
          setAutoStopTimer(null);
        } catch (stopError: any) {
          addLog(`❌ 自动停止失败: ${stopError.message}`, 'error');
          setStatus('停止失败');
          setIsActive(false);
        }
      }, 5 * 60 * 1000); // 5分钟
      
      setAutoStopTimer(timer);
      addLog('ℹ️ 语音识别将在5分钟后自动停止，或点击停止按钮手动停止', 'info');

    } catch (error: any) {
      addLog(`❌ 测试失败: ${error.message}`, 'error');
      setStatus('测试失败');
      setIsActive(false);
    }
  };

  const testBrowserSpeech = async () => {
    startTimeRef.current = Date.now();
    setIsActive(true);
    setStatus('测试中...');
    addLog('🌐 开始浏览器语音识别测试', 'info');

    try {
      addLog('步骤1: 设置语音服务提供商为浏览器');
      speechService.setProvider('browser');

      addLog('步骤2: 启动语音识别');
      await speechService.startListening();
      addLog('✅ 语音识别启动成功', 'success');
      setStatus('正在识别...');

      // 设置5分钟的安全超时，防止长时间运行
      const timer = setTimeout(() => {
        try {
          speechService.stopListening();
          addLog('⏰ 语音识别已自动停止（5分钟超时）', 'warning');
          setStatus('自动停止');
          setIsActive(false);
          setAutoStopTimer(null);
        } catch (stopError: any) {
          addLog(`❌ 自动停止失败: ${stopError.message}`, 'error');
          setStatus('停止失败');
          setIsActive(false);
        }
      }, 5 * 60 * 1000); // 5分钟
      
      setAutoStopTimer(timer);
      addLog('ℹ️ 语音识别将在5分钟后自动停止，或点击停止按钮手动停止', 'info');

    } catch (error: any) {
      addLog(`❌ 测试失败: ${error.message}`, 'error');
      setStatus('测试失败');
      setIsActive(false);
    }
  };

  const emergencyStop = () => {
    try {
      if (autoStopTimer) {
        clearTimeout(autoStopTimer);
        setAutoStopTimer(null);
      }
      speechService.stopListening();
      setIsActive(false);
      setStatus('紧急停止');
      addLog('🚨 紧急停止完成', 'warning');
    } catch (error: any) {
      addLog(`❌ 紧急停止失败: ${error.message}`, 'error');
      setStatus('停止失败');
    }
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          width: '900px',
          maxHeight: '95vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            🎤 实时语音识别测试
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isActive && (
              <button onClick={emergencyStop} style={{...buttonStyle, backgroundColor: '#ff4d4f'}}>
                🚨 紧急停止
              </button>
            )}
            <button onClick={onClose} style={{...buttonStyle, backgroundColor: '#666'}}>
              关闭
            </button>
          </div>
        </div>
        
        <div style={{ 
          padding: '15px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ 
            fontSize: '20px',
            color: isActive ? '#1890ff' : '#52c41a'
          }}>
            {isActive ? '🔄' : '✅'}
          </span>
          <div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>状态: {status}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              使用稳定优化的语音识别服务，支持腾讯云和浏览器识别
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div style={{ display: 'grid', gridTemplateColumns: isActive ? '1fr 1fr 1fr' : '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <button 
            onClick={testSafeTencentSpeech} 
            disabled={isActive}
            style={{
              ...buttonStyle, 
              backgroundColor: isActive ? '#ccc' : '#1890ff',
              cursor: isActive ? 'not-allowed' : 'pointer'
            }}
          >
            🎤 腾讯云语音识别
          </button>
          <button 
            onClick={testBrowserSpeech} 
            disabled={isActive}
            style={{
              ...buttonStyle, 
              backgroundColor: isActive ? '#ccc' : '#52c41a',
              cursor: isActive ? 'not-allowed' : 'pointer'
            }}
          >
            🌐 浏览器语音识别
          </button>
          {isActive && (
            <button 
              onClick={stopSpeechRecognition} 
              style={{
                ...buttonStyle, 
                backgroundColor: '#fa541c',
                color: 'white'
              }}
            >
              ⏹️ 停止识别
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={clearLogs} style={{...buttonStyle, backgroundColor: '#666'}}>
            🧹 清空日志
          </button>
        </div>

        {/* 语音识别结果显示 - 始终显示 */}
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f6ffed',
          border: '2px solid #52c41a',
          borderRadius: '8px',
          minHeight: '120px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
            🎯 语音识别结果:
          </h4>
          
          {/* 当前识别中的文本 */}
          {currentTranscript && (
            <div style={{ 
              padding: '10px',
              backgroundColor: '#fff7e6',
              border: '2px dashed #faad14',
              borderRadius: '6px',
              marginBottom: '10px',
              fontSize: '14px',
              color: '#d48806',
              fontWeight: 'bold'
            }}>
              <span style={{ fontWeight: 'bold' }}>🔄 正在识别: </span>
              {currentTranscript}
            </div>
          )}
          
          {/* 已确认的识别结果 */}
          {speechResults.length > 0 && speechResults.map((result, index) => (
            <div key={index} style={{ 
              padding: '10px',
              backgroundColor: '#f6ffed',
              border: '2px solid #52c41a',
              borderRadius: '6px',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#389e0d',
              fontWeight: 'bold'
            }}>
              <span style={{ fontWeight: 'bold' }}>✅ 结果 {index + 1}: </span>
              {result}
            </div>
          ))}
          
          {speechResults.length === 0 && !currentTranscript && (
            <div style={{ 
              color: '#999',
              fontSize: '14px',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '40px 20px',
              border: '2px dashed #d9d9d9',
              borderRadius: '6px',
              backgroundColor: '#fafafa'
            }}>
              {isActive ? '🎤 请开始说话，识别结果将显示在这里...' : '点击上方按钮开始语音识别测试'}
            </div>
          )}
        </div>

        {/* 实时日志 */}
        <div style={{ 
          height: '400px', 
          border: '2px solid #ddd', 
          borderRadius: '8px', 
          padding: '15px',
          backgroundColor: '#001529',
          color: '#00ff41',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', paddingTop: '150px' }}>
              实时语音识别测试就绪...
              <br />
              <small>选择腾讯云或浏览器语音识别开始测试</small>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '3px',
                color: log.includes('❌') ? '#ff4d4f' : 
                      log.includes('✅') ? '#52c41a' : 
                      log.includes('⚠️') ? '#faad14' : '#00ff41',
                wordBreak: 'break-all'
              }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const buttonStyle = {
  padding: '12px 20px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#3182ce',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

export default SafeSpeechTest;