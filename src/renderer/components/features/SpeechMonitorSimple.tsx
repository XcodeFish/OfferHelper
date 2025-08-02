import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface SpeechMonitorSimpleProps {
  visible: boolean;
  onClose: () => void;
  provider: 'browser' | 'tencent';
}

const SpeechMonitorSimple: React.FC<SpeechMonitorSimpleProps> = ({ visible, onClose, provider }) => {
  const [error, setError] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>(['组件已加载']);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-10), `[${timestamp}] ${message}`]);
  };

  const handleTestButton = () => {
    addDebugLog('测试按钮被点击');
    setError(''); // 清除任何错误
    
    try {
      addDebugLog('执行测试逻辑...');
      // 模拟一些操作，不涉及语音识别
      setTimeout(() => {
        addDebugLog('测试完成，没有崩溃');
      }, 100);
    } catch (err: any) {
      const errorMsg = err.message || '测试失败';
      addDebugLog(`❌ 测试出错: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const handleClose = () => {
    addDebugLog('关闭对话框');
    onClose();
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
      }}
      onClick={handleClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '600px',
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
            🧪 简化测试对话框 ({provider})
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

        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>调试日志:</h4>
          <div style={{
            height: '200px',
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
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleTestButton}
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
            🧪 测试按钮
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SpeechMonitorSimple;