import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SpeechService } from '../../services/SpeechService';
import { ConfigManager } from '../../utils/configManager';
import { cleanupSpeechService } from '../../utils/speechUtils';

interface SpeechMonitorProps {
  visible: boolean;
  onClose: () => void;
  provider: 'browser' | 'tencent';
}

const SpeechMonitor: React.FC<SpeechMonitorProps> = ({ visible, onClose, provider }) => {
  console.log('🎯 SpeechMonitor 组件开始初始化', { visible, provider });
  
  const [error, setError] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>(['组件已初始化']);
  const speechServiceRef = useRef<SpeechService | null>(null);
  const isClosingRef = useRef(false);
  const isMountedRef = useRef(true);
  
  console.log('✅ SpeechMonitor 组件状态初始化完成');

  const addDebugLog = (message: string) => {
    if (!isMountedRef.current) return;
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-10), `[${timestamp}] ${message}`]);
  };

  const handleClose = async () => {
    if (isClosingRef.current) return;
    
    isClosingRef.current = true;
    addDebugLog('⚠️ 开始关闭流程');
    
    try {
      if (isListening && speechServiceRef.current) {
        await speechServiceRef.current.stopListening();
        addDebugLog('已停止语音识别');
      }
      
      await cleanupSpeechService();
      addDebugLog('语音服务资源已清理');
      
    } catch (error) {
      addDebugLog(`清理资源时出错: ${error}`);
    } finally {
      if (isMountedRef.current) {
        setIsListening(false);
        setError('');
        setTranscript('');
        setInterimTranscript('');
        setDebugLogs([]);
      }
      speechServiceRef.current = null;
      isClosingRef.current = false;
      onClose();
    }
  };

  useEffect(() => {
    console.log('📋 SpeechMonitor useEffect 被调用', { visible, provider });
    
    if (!visible) {
      console.log('⏸️ SpeechMonitor 不可见，跳过初始化');
      return;
    }

    // 防止重复初始化
    if (speechServiceRef.current) {
      console.log('⚠️ SpeechService 已存在，跳过重复初始化');
      return;
    }

    console.log('🚀 SpeechMonitor 开始初始化');
    isMountedRef.current = true;
    addDebugLog(`语音识别监控器启动，提供商: ${provider}`);
    
    const speechService = new SpeechService();
    speechServiceRef.current = speechService;
    
    // 事件处理函数
    const handleTranscript = (event: any) => {
      if (!isMountedRef.current) return;
      const transcriptText = event.detail?.transcript || event.transcript || '';
      addDebugLog(`收到识别结果: ${transcriptText}`);
      setTranscript(transcriptText);
    };

    const handleInterimTranscript = (event: any) => {
      if (!isMountedRef.current) return;
      const interim = event.detail?.interimTranscript || event.interimTranscript || '';
      addDebugLog(`收到临时结果: ${interim}`);
      setInterimTranscript(interim);
    };

    const handleError = (event: any) => {
      if (!isMountedRef.current) return;
      try {
        const errorMsg = event.detail?.error || event.error || '未知错误';
        addDebugLog(`语音识别错误: ${errorMsg}`);
        
        // 对于aborted错误，不设置为严重错误，因为这通常是正常的中断
        if (errorMsg === 'aborted') {
          addDebugLog('语音识别被正常中断，这是预期行为');
          setIsListening(false);
          return;
        }
        
        setError(errorMsg);
        setIsListening(false);
      } catch (err) {
        addDebugLog(`处理错误事件时出错: ${err}`);
      }
    };

    const handleStart = () => {
      if (!isMountedRef.current) return;
      
      try {
        addDebugLog('✅ handleStart被调用');
        
        // 使用异步方式更新状态，避免同步渲染崩溃
        setTimeout(() => {
          if (isMountedRef.current) {
            try {
              addDebugLog('✅ 准备更新isListening状态');
              setIsListening(true);
              addDebugLog('✅ isListening状态更新成功');
            } catch (error) {
              addDebugLog(`❌ 更新isListening状态失败: ${error}`);
            }
          }
        }, 50);
        
        addDebugLog('✅ handleStart执行完成');
      } catch (error) {
        addDebugLog(`❌ handleStart执行失败: ${error}`);
      }
    };

    const handleEnd = () => {
      if (!isMountedRef.current) return;
      addDebugLog('语音识别结束');
      setIsListening(false);
    };

    // 使用 AbortController 管理事件监听器
    const abortController = new AbortController();
    const eventOptions = { signal: abortController.signal };
    
    try {
      document.addEventListener('speechTranscript', handleTranscript, eventOptions);
      document.addEventListener('speechInterimTranscript', handleInterimTranscript, eventOptions);
      document.addEventListener('speechError', handleError, eventOptions);
      document.addEventListener('speechStart', handleStart, eventOptions);
      document.addEventListener('speechEnd', handleEnd, eventOptions);
      
      addDebugLog('事件监听器已添加');
    } catch (error) {
      addDebugLog(`添加事件监听器失败: ${error}`);
    }

    return () => {
      isMountedRef.current = false;
      addDebugLog('🧹 useEffect清理函数执行');
      
      try {
        abortController.abort();
        addDebugLog('事件监听器已移除');
      } catch (error) {
        addDebugLog(`移除事件监听器失败: ${error}`);
      }
    };
  }, [visible]); // 移除provider依赖，防止无限循环

  // 组件卸载时设置标志
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const toggleListening = async () => {
    if (!speechServiceRef.current) {
      addDebugLog('语音服务引用不存在，创建新实例');
      speechServiceRef.current = new SpeechService();
    }
    
    const speechService = speechServiceRef.current;
    
    try {
      if (isListening) {
        addDebugLog('停止语音识别...');
        await speechService.stopListening();
        setIsListening(false);
      } else {
        addDebugLog(`开始语音识别，提供商: ${provider}`);
        setError('');
        setTranscript('');
        setInterimTranscript('');
        
        // 设置语音识别提供商
        speechService.setProvider(provider);
        
        if (provider === 'tencent') {
          const tencentConfig = ConfigManager.getTencentConfig();
          
          addDebugLog(`读取腾讯云配置: secretId=${tencentConfig.secretId ? '已设置' : '未设置'}, secretKey=${tencentConfig.secretKey ? '已设置' : '未设置'}, appId=${tencentConfig.appId || '未设置'}`);
          
          if (!tencentConfig.secretId || !tencentConfig.secretKey) {
            throw new Error('请先在设置中配置腾讯云 SecretId 和 SecretKey');
          }
          
          addDebugLog(`使用腾讯云配置: region=${tencentConfig.region}, engineType=${tencentConfig.engineType}, appId=${tencentConfig.appId}`);
          speechService.setTencentConfig(tencentConfig);
        }
        
        await speechService.startListening();
        // 注意：不在这里设置 setIsListening(true)，等待事件回调
      }
    } catch (err: any) {
      const errorMsg = err.message || '语音识别启动失败';
      addDebugLog(`❌ 操作失败: ${errorMsg}`);
      setError(errorMsg);
      setIsListening(false);
    }
  };

  const clearResults = () => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
    addDebugLog('清空识别结果');
  };

  if (!visible) {
    return null;
  }

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        pointerEvents: 'auto'
      }}
      onClick={handleClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '700px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* 标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #eee',
          paddingBottom: '12px'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
            🎤 语音识别测试 ({provider === 'browser' ? '浏览器' : '腾讯云'})
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: '#ff4d4f',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 16px'
            }}
          >
            关闭
          </button>
        </div>

        {/* 状态指示器 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: isListening ? '#f6ffed' : '#fafafa',
          border: `2px solid ${isListening ? '#52c41a' : '#d9d9d9'}`,
          borderRadius: '6px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isListening ? '#52c41a' : '#d9d9d9'
          }} />
          <span style={{ fontWeight: 'bold', color: isListening ? '#52c41a' : '#666' }}>
            {isListening ? '🎙️ 正在监听...' : '⏸️ 未在监听'}
          </span>
        </div>

        {/* 错误信息 */}
        {error && (
          <div style={{
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
            color: '#ff4d4f'
          }}>
            ❌ 错误: {error}
          </div>
        )}

        {/* 识别结果 */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>识别结果:</h4>
          <div style={{
            minHeight: '80px',
            padding: '12px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            {transcript && (
              <div style={{ color: '#333', marginBottom: '8px' }}>
                <strong>最终结果:</strong> {transcript}
              </div>
            )}
            {interimTranscript && (
              <div style={{ color: '#666', fontStyle: 'italic' }}>
                <strong>临时结果:</strong> {interimTranscript}
              </div>
            )}
            {!transcript && !interimTranscript && (
              <div style={{ color: '#999' }}>
                {isListening ? '请开始说话...' : '点击开始按钮开始语音识别'}
              </div>
            )}
          </div>
        </div>

        {/* 调试日志 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>调试日志:</h4>
          <div style={{
            height: '120px',
            padding: '8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            fontSize: '12px',
            fontFamily: 'monospace',
            overflow: 'auto'
          }}>
            {debugLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px', color: '#666' }}>
                {log}
              </div>
            ))}
            {debugLogs.length === 0 && (
              <div style={{ color: '#999' }}>暂无调试信息</div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={clearResults}
            disabled={!transcript && !interimTranscript}
            style={{
              padding: '10px 20px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#666',
              cursor: transcript || interimTranscript ? 'pointer' : 'not-allowed',
              opacity: transcript || interimTranscript ? 1 : 0.5
            }}
          >
            清空结果
          </button>
          <button
            onClick={toggleListening}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isListening ? '#ff4d4f' : '#1890ff',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isListening ? '🛑 停止识别' : '🎙️ 开始识别'}
          </button>
        </div>
      </div>
    </div>
  );

  try {
    return createPortal(modalContent, document.body);
  } catch (portalError) {
    return null;
  }
};

export default SpeechMonitor;