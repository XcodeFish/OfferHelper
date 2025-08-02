import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SpeechService } from '../../services/SpeechService';
import { ConfigManager } from '../../utils/configManager';

interface SpeechMonitorStaticProps {
  visible: boolean;
  onClose: () => void;
  provider: 'browser' | 'tencent';
}

const SpeechMonitorStatic: React.FC<SpeechMonitorStaticProps> = ({ visible, onClose, provider }) => {
  const speechServiceRef = useRef<SpeechService | null>(null);
  const initializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || initializedRef.current) return;
    
    console.log('🎯 SpeechMonitorStatic 一次性初始化开始');
    initializedRef.current = true;
    
    // 创建语音服务（一次性，不会重复创建）
    const speechService = new SpeechService();
    speechServiceRef.current = speechService;
    
    // 设置提供商和配置
    speechService.setProvider(provider);
    if (provider === 'tencent') {
      const tencentConfig = ConfigManager.getTencentConfig();
      if (tencentConfig.secretId && tencentConfig.secretKey) {
        speechService.setTencentConfig(tencentConfig);
      }
    }
    
    // 直接操作DOM，完全避开React状态
    const updateStatus = (text: string, color: string) => {
      const statusEl = document.getElementById('speech-status');
      if (statusEl) {
        statusEl.textContent = text;
        statusEl.style.color = color;
      }
    };
    
    const updateButton = (text: string, color: string) => {
      const buttonEl = document.getElementById('speech-button') as HTMLButtonElement;
      if (buttonEl) {
        buttonEl.textContent = text;
        buttonEl.style.backgroundColor = color;
      }
    };
    
    const addLog = (message: string) => {
      const logEl = document.getElementById('speech-logs');
      if (logEl) {
        const timestamp = new Date().toLocaleTimeString();
        logEl.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
      }
    };
    
    // 事件处理（直接DOM操作，不触发React重渲染）
    let isListening = false;
    
    const handleStart = () => {
      console.log('✅ 收到 speech:started 事件');
      isListening = true;
      updateStatus('🎙️ 正在监听...', '#52c41a');
      updateButton('🛑 停止识别', '#ff4d4f');
      addLog('✅ 语音识别已启动');
    };
    
    const handleEnd = () => {
      console.log('✅ 收到 speech:ended 事件');
      isListening = false;
      updateStatus('⏸️ 未在监听', '#666');
      updateButton('🎙️ 开始识别', '#1890ff');
      addLog('⏸️ 语音识别已停止');
    };
    
    const handleError = (event: any) => {
      const errorMsg = event.detail?.error || event.error || '未知错误';
      console.log('❌ 收到 speech:error 事件:', errorMsg);
      isListening = false;
      updateStatus('❌ 识别错误', '#ff4d4f');
      updateButton('🎙️ 开始识别', '#1890ff');
      addLog(`❌ 错误: ${errorMsg}`);
    };
    
    const handleResult = (event: any) => {
      const transcript = event.detail?.transcript || '';
      console.log('📝 收到识别结果:', transcript);
      addLog(`📝 识别结果: ${transcript}`);
    };
    
    // 添加事件监听器（一次性）
    document.addEventListener('speechStart', handleStart);
    document.addEventListener('speechEnd', handleEnd);
    document.addEventListener('speechError', handleError);
    document.addEventListener('speechTranscript', handleResult);
    
    // 按钮点击处理
    const handleButtonClick = async () => {
      const buttonEl = document.getElementById('speech-button') as HTMLButtonElement;
      if (!buttonEl || !speechService) return;
      
      try {
        if (isListening) {
          addLog('⏸️ 停止语音识别...');
          speechService.stopListening();
        } else {
          addLog('🎙️ 启动语音识别...');
          buttonEl.disabled = true;
          buttonEl.textContent = '启动中...';
          await speechService.startListening();
          buttonEl.disabled = false;
        }
      } catch (error: any) {
        addLog(`❌ 操作失败: ${error.message}`);
        buttonEl.disabled = false;
        updateButton('🎙️ 开始识别', '#1890ff');
      }
    };
    
    // 绑定按钮事件（延迟绑定，确保DOM已渲染）
    setTimeout(() => {
      const buttonEl = document.getElementById('speech-button');
      if (buttonEl) {
        buttonEl.addEventListener('click', handleButtonClick);
      }
    }, 100);
    
    addLog('🎯 语音识别监控器已初始化');
    console.log('✅ SpeechMonitorStatic 初始化完成');
    
    // 清理函数
    return () => {
      document.removeEventListener('speechStart', handleStart);
      document.removeEventListener('speechEnd', handleEnd);
      document.removeEventListener('speechError', handleError);
      document.removeEventListener('speechTranscript', handleResult);
      
      const buttonEl = document.getElementById('speech-button');
      if (buttonEl) {
        buttonEl.removeEventListener('click', handleButtonClick);
      }
    };
  }, [visible]); // 只依赖visible

  if (!visible) {
    return null;
  }

  // 完全静态的JSX，不包含任何状态
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
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '700px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
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
            onClick={onClose}
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
          backgroundColor: '#fafafa',
          border: '2px solid #d9d9d9',
          borderRadius: '6px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#d9d9d9'
          }} />
          <span id="speech-status" style={{ fontWeight: 'bold', color: '#666' }}>
            ⏸️ 未在监听
          </span>
        </div>

        {/* 调试日志 */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>调试日志:</h4>
          <div 
            id="speech-logs"
            style={{
              height: '200px',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto'
            }}
          />
        </div>

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            id="speech-button"
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1890ff',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🎙️ 开始识别
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SpeechMonitorStatic;