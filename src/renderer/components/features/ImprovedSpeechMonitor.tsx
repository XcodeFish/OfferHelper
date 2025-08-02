import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SpeechService } from '../../services/SpeechService';
import { ConfigManager } from '../../utils/configManager';

interface ImprovedSpeechMonitorProps {
  visible: boolean;
  onClose: () => void;
  provider: 'browser' | 'tencent';
}

const ImprovedSpeechMonitor: React.FC<ImprovedSpeechMonitorProps> = ({ visible, onClose, provider }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'starting' | 'listening' | 'error' | 'stopped'>('idle');
  
  const speechServiceRef = useRef<SpeechService | null>(null);
  const isMountedRef = useRef(true);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (!isMountedRef.current) return;
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    setLogs(prev => [...prev.slice(-15), `[${timestamp}] ${emoji} ${message}`]);
  };

  const handleClose = () => {
    addLog('用户关闭对话框');
    if (speechServiceRef.current && isListening) {
      speechServiceRef.current.stopListening();
    }
    onClose();
  };

  useEffect(() => {
    if (!visible) return;
    
    isMountedRef.current = true;
    addLog(`语音识别监控器启动，提供商: ${provider}`);
    
    const speechService = new SpeechService();
    speechServiceRef.current = speechService;
    speechService.setProvider(provider);
    
    if (provider === 'tencent') {
      const config = ConfigManager.getTencentConfig();
      if (config.secretId && config.secretKey) {
        speechService.setTencentConfig(config);
        addLog('腾讯云配置已加载');
      } else {
        setError('腾讯云配置不完整，请检查设置');
        return;
      }
    }

    // 优化的事件处理
    const handleStart = () => {
      if (!isMountedRef.current) return;
      addLog('语音识别已启动', 'success');
      setStatus('listening');
      setIsListening(true);
      setError('');
    };

    const handleEnd = () => {
      if (!isMountedRef.current) return;
      addLog('语音识别已结束');
      setStatus('stopped');
      setIsListening(false);
    };

    const handleError = (event: any) => {
      if (!isMountedRef.current) return;
      const errorMsg = event.detail?.error || event.error || '未知错误';
      
      // 根据错误类型提供友好的消息
      const errorMessages: Record<string, string> = {
        'network': '网络连接问题，请检查网络或稍后重试',
        'no-speech': '未检测到语音输入，请重新尝试',
        'audio-capture': '无法访问麦克风，请检查权限设置',
        'not-allowed': '麦克风权限被拒绝，请在浏览器中允许麦克风访问',
        'service-not-allowed': '语音识别服务不可用',
        'bad-grammar': '语音识别语法错误',
        'language-not-supported': '不支持的语言',
        'aborted': '语音识别被中断（这是正常的停止操作）'
      };
      
      const friendlyMessage = errorMessages[errorMsg] || `语音识别错误: ${errorMsg}`;
      
      if (errorMsg === 'aborted') {
        addLog(friendlyMessage, 'info');
      } else {
        addLog(friendlyMessage, 'error');
        setError(friendlyMessage);
      }
      
      setStatus('error');
      setIsListening(false);
    };

    const handleResult = (event: any) => {
      if (!isMountedRef.current) return;
      const text = event.detail?.transcript || '';
      if (text) {
        addLog(`识别结果: ${text}`, 'success');
        setTranscript(text);
      }
    };

    // 注册事件监听器
    document.addEventListener('speechStart', handleStart);
    document.addEventListener('speechEnd', handleEnd);
    document.addEventListener('speechError', handleError);
    document.addEventListener('speechTranscript', handleResult);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener('speechStart', handleStart);
      document.removeEventListener('speechEnd', handleEnd);
      document.removeEventListener('speechError', handleError);
      document.removeEventListener('speechTranscript', handleResult);
    };
  }, [visible, provider]);

  const toggleListening = async () => {
    if (!speechServiceRef.current) return;

    try {
      if (isListening) {
        addLog('正在停止语音识别...');
        setStatus('stopping');
        await speechServiceRef.current.stopListening();
      } else {
        addLog('正在启动语音识别...');
        setStatus('starting');
        setError('');
        setTranscript('');
        await speechServiceRef.current.startListening();
      }
    } catch (err: any) {
      const errorMsg = err.message || '操作失败';
      addLog(errorMsg, 'error');
      setError(errorMsg);
      setStatus('error');
      setIsListening(false);
    }
  };

  if (!visible) return null;

  return createPortal(
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
      }}
      onClick={handleClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          width: '700px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* 标题栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
            🎤 语音识别测试 ({provider === 'browser' ? '浏览器' : '腾讯云'})
          </h2>
          <button onClick={handleClose} style={closeButtonStyle}>
            关闭
          </button>
        </div>

        {/* 状态指示器 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: getStatusColor(status).bg,
          border: `2px solid ${getStatusColor(status).border}`,
          borderRadius: '8px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(status).dot,
            animation: isListening ? 'pulse 2s infinite' : 'none'
          }} />
          <div>
            <div style={{ fontWeight: 'bold', color: getStatusColor(status).text, marginBottom: '4px' }}>
              {getStatusText(status, isListening)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {getStatusDescription(status)}
            </div>
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#c53030'
          }}>
            <strong>注意：</strong> {error}
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#718096' }}>
              这通常不是崩溃，而是正常的API错误。请检查网络连接或权限设置。
            </div>
          </div>
        )}

        {/* 识别结果 */}
        {transcript && (
          <div style={{
            backgroundColor: '#f0fff4',
            border: '1px solid #9ae6b4',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>
              识别结果：
            </div>
            <div style={{ color: '#1a202c', fontSize: '16px', lineHeight: '1.5' }}>
              {transcript}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'center' }}>
          <button
            onClick={toggleListening}
            disabled={status === 'starting' || status === 'stopping'}
            style={{
              ...actionButtonStyle,
              backgroundColor: isListening ? '#e53e3e' : '#3182ce',
              opacity: (status === 'starting' || status === 'stopping') ? 0.6 : 1,
              cursor: (status === 'starting' || status === 'stopping') ? 'not-allowed' : 'pointer'
            }}
          >
            {getButtonText(status, isListening)}
          </button>
          
          {transcript && (
            <button
              onClick={() => {
                setTranscript('');
                addLog('识别结果已清空');
              }}
              style={{...actionButtonStyle, backgroundColor: '#718096'}}
            >
              清空结果
            </button>
          )}
        </div>

        {/* 调试日志 */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>实时日志:</h4>
          <div style={{
            height: '150px',
            padding: '10px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: '#f7fafc',
            fontSize: '12px',
            fontFamily: 'monospace',
            overflow: 'auto'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#a0aec0' }}>等待操作...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '2px', color: '#2d3748' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* 添加CSS动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>,
    document.body
  );
};

// 辅助函数
function getStatusColor(status: string) {
  switch (status) {
    case 'listening': return { bg: '#f0fff4', border: '#68d391', dot: '#38a169', text: '#2f855a' };
    case 'error': return { bg: '#fff5f5', border: '#fc8181', dot: '#e53e3e', text: '#c53030' };
    case 'starting': return { bg: '#fffaf0', border: '#f6ad55', dot: '#dd6b20', text: '#c05621' };
    case 'stopping': return { bg: '#f7fafc', border: '#a0aec0', dot: '#718096', text: '#4a5568' };
    default: return { bg: '#f7fafc', border: '#e2e8f0', dot: '#a0aec0', text: '#4a5568' };
  }
}

function getStatusText(status: string, isListening: boolean) {
  switch (status) {
    case 'listening': return '🎙️ 正在监听';
    case 'error': return '❌ 发生错误';
    case 'starting': return '🔄 正在启动...';
    case 'stopping': return '🔄 正在停止...';
    case 'stopped': return '⏸️ 已停止';
    default: return '⏸️ 待机中';
  }
}

function getStatusDescription(status: string) {
  switch (status) {
    case 'listening': return '请开始说话，系统正在监听您的语音';
    case 'error': return '遇到问题，请查看错误信息或重试';
    case 'starting': return '正在初始化语音识别服务...';
    case 'stopping': return '正在关闭语音识别服务...';
    case 'stopped': return '语音识别已停止';
    default: return '点击按钮开始语音识别';
  }
}

function getButtonText(status: string, isListening: boolean) {
  switch (status) {
    case 'starting': return '⏳ 启动中...';
    case 'stopping': return '⏳ 停止中...';
    case 'listening': return '🛑 停止识别';
    default: return '🎙️ 开始识别';
  }
}

const closeButtonStyle = {
  background: '#e53e3e',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '8px 16px'
};

const actionButtonStyle = {
  padding: '12px 24px',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  minWidth: '120px'
};

export default ImprovedSpeechMonitor;