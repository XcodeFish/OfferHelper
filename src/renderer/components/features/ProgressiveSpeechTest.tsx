import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { EventBus } from '../../../shared/utils/EventBus';
import { SpeechService } from '../../services/SpeechService';

interface ProgressiveSpeechTestProps {
  visible: boolean;
  onClose: () => void;
}

const ProgressiveSpeechTest: React.FC<ProgressiveSpeechTestProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const speechServiceRef = useRef<SpeechService | null>(null);

  if (!visible) {
    return null;
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
    console.log(`[ProgressiveTest] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // 测试1：创建SpeechService实例
  const handleTest1 = () => {
    addLog('🧪 测试1：创建SpeechService实例');
    try {
      const service = new SpeechService();
      speechServiceRef.current = service;
      addLog('✅ SpeechService实例创建成功');
    } catch (error: any) {
      addLog(`❌ SpeechService实例创建失败: ${error.message}`);
    }
  };

  // 测试2：设置provider为browser
  const handleTest2 = () => {
    addLog('🧪 测试2：设置provider为browser');
    try {
      if (!speechServiceRef.current) {
        throw new Error('SpeechService实例不存在，请先运行测试1');
      }
      speechServiceRef.current.setProvider('browser');
      addLog('✅ provider设置为browser成功');
    } catch (error: any) {
      addLog(`❌ 设置provider失败: ${error.message}`);
    }
  };

  // 测试3：仅调用initializeBrowserSpeech
  const handleTest3 = () => {
    addLog('🧪 测试3：初始化浏览器语音识别');
    try {
      if (!speechServiceRef.current) {
        throw new Error('SpeechService实例不存在，请先运行测试1');
      }
      
      // 直接访问私有方法进行测试（仅用于调试）
      const service = speechServiceRef.current as any;
      if (service.initializeBrowserSpeech) {
        service.initializeBrowserSpeech();
        addLog('✅ 浏览器语音识别初始化成功');
      } else {
        addLog('⚠️ initializeBrowserSpeech方法不存在');
      }
    } catch (error: any) {
      addLog(`❌ 浏览器语音识别初始化失败: ${error.message}`);
    }
  };

  // 测试4：注册事件监听器
  const handleTest4 = () => {
    addLog('🧪 测试4：注册事件监听器');
    try {
      const handleStart = () => addLog('📡 收到 speechStart 事件');
      const handleEnd = () => addLog('📡 收到 speechEnd 事件');
      const handleError = (event: any) => addLog(`📡 收到 speechError 事件: ${event.detail?.error || 'unknown'}`);
      const handleResult = (event: any) => addLog(`📡 收到 speechTranscript 事件: ${event.detail?.transcript || 'empty'}`);

      document.addEventListener('speechStart', handleStart);
      document.addEventListener('speechEnd', handleEnd);
      document.addEventListener('speechError', handleError);
      document.addEventListener('speechTranscript', handleResult);

      addLog('✅ 事件监听器注册成功');
    } catch (error: any) {
      addLog(`❌ 事件监听器注册失败: ${error.message}`);
    }
  };

  // 测试5：手动发射EventBus事件
  const handleTest5 = () => {
    addLog('🧪 测试5：手动发射EventBus.emit(speech:started)');
    try {
      EventBus.emit('speech:started');
      addLog('✅ EventBus.emit(speech:started)成功');
    } catch (error: any) {
      addLog(`❌ EventBus.emit(speech:started)失败: ${error.message}`);
    }
  };

  // 测试6：尝试启动语音识别（不实际开始）
  const handleTest6 = () => {
    addLog('🧪 测试6：尝试startListening（可能崩溃点）');
    try {
      if (!speechServiceRef.current) {
        throw new Error('SpeechService实例不存在，请先运行测试1');
      }
      
      addLog('⚠️ 准备调用startListening，这可能会导致崩溃...');
      
      // 异步调用，避免阻塞UI
      setTimeout(async () => {
        try {
          await speechServiceRef.current!.startListening();
          addLog('✅ startListening调用成功');
        } catch (error: any) {
          addLog(`❌ startListening调用失败: ${error.message}`);
        }
      }, 100);
      
    } catch (error: any) {
      addLog(`❌ startListening准备失败: ${error.message}`);
    }
  };

  // 停止语音识别
  const handleStop = () => {
    addLog('🛑 尝试停止语音识别');
    try {
      if (speechServiceRef.current) {
        speechServiceRef.current.stopListening();
        addLog('✅ 语音识别已停止');
      }
    } catch (error: any) {
      addLog(`❌ 停止语音识别失败: ${error.message}`);
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          borderRadius: '8px',
          padding: '30px',
          width: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            🔍 渐进式语音识别测试
          </h2>
          <button onClick={onClose} style={closeButtonStyle}>关闭</button>
        </div>
        
        <p style={{ color: '#666', marginBottom: '20px' }}>
          逐步构建语音识别功能，找出确切崩溃点
        </p>

        {/* 测试按钮区域 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleTest1} style={testButtonStyle}>
            1. 创建Service
          </button>
          <button onClick={handleTest2} style={testButtonStyle}>
            2. 设置Provider
          </button>
          <button onClick={handleTest3} style={testButtonStyle}>
            3. 初始化识别
          </button>
          <button onClick={handleTest4} style={testButtonStyle}>
            4. 注册监听器
          </button>
          <button onClick={handleTest5} style={testButtonStyle}>
            5. 发射事件
          </button>
          <button onClick={handleTest6} style={{...testButtonStyle, backgroundColor: '#ff4d4f'}}>
            6. 启动识别 ⚠️
          </button>
        </div>

        {/* 控制按钮 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleStop} style={{...testButtonStyle, backgroundColor: '#ff4d4f'}}>
            🛑 停止识别
          </button>
          <button onClick={clearLogs} style={{...testButtonStyle, backgroundColor: '#666'}}>
            🧹 清空日志
          </button>
        </div>

        {/* 日志区域 */}
        <div style={{ 
          height: '300px', 
          border: '1px solid #ddd', 
          borderRadius: '4px', 
          padding: '10px',
          backgroundColor: '#f5f5f5',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#999' }}>点击测试按钮开始...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px', color: '#333' }}>
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

const testButtonStyle = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#1890ff',
  color: 'white',
  cursor: 'pointer',
  fontSize: '12px'
};

const closeButtonStyle = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#ff4d4f',
  color: 'white',
  cursor: 'pointer'
};

export default ProgressiveSpeechTest;