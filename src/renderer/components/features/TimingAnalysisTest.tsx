import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TimingAnalysisTestProps {
  visible: boolean;
  onClose: () => void;
}

const TimingAnalysisTest: React.FC<TimingAnalysisTestProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const startTimeRef = useRef<number>(0);

  if (!visible) {
    return null;
  }

  const addLog = (message: string, includeTime: boolean = true) => {
    const now = Date.now();
    const timeStr = includeTime && startTimeRef.current ? 
      `+${now - startTimeRef.current}ms` : 
      new Date().toLocaleTimeString();
    
    const logMessage = `[${timeStr}] ${message}`;
    console.log(`[TimingTest] ${logMessage}`);
    setLogs(prev => [...prev.slice(-30), logMessage]);
  };

  const clearLogs = () => {
    setLogs([]);
    startTimeRef.current = 0;
  };

  // 测试1: 纯React状态更新时序
  const testReactTiming = () => {
    startTimeRef.current = Date.now();
    addLog('🧪 开始React状态更新时序测试', false);
    
    // 连续的同步状态更新
    addLog('第1步: 同步状态更新');
    setLogs(prev => [...prev, '[状态更新1] 同步更新']);
    
    addLog('第2步: 异步状态更新');
    setTimeout(() => {
      setLogs(prev => [...prev, '[状态更新2] 异步更新']);
      addLog('第3步: 异步更新完成');
    }, 0);
    
    addLog('第4步: 微任务状态更新');
    Promise.resolve().then(() => {
      setLogs(prev => [...prev, '[状态更新3] 微任务更新']);
      addLog('第5步: 微任务更新完成');
    });
    
    addLog('测试函数执行完毕');
  };

  // 测试2: 事件监听器时序
  const testEventListenerTiming = () => {
    startTimeRef.current = Date.now();
    addLog('🧪 开始事件监听器时序测试', false);
    
    // 创建事件监听器
    const handler1 = () => addLog('事件处理器1触发');
    const handler2 = () => addLog('事件处理器2触发');
    const handler3 = () => addLog('事件处理器3触发');
    
    addLog('第1步: 注册事件监听器');
    document.addEventListener('timingTest', handler1);
    document.addEventListener('timingTest', handler2);
    document.addEventListener('timingTest', handler3);
    
    addLog('第2步: 发射事件');
    const event = new CustomEvent('timingTest', { detail: { test: 'data' } });
    document.dispatchEvent(event);
    
    addLog('第3步: 事件发射完成');
    
    // 清理
    setTimeout(() => {
      document.removeEventListener('timingTest', handler1);
      document.removeEventListener('timingTest', handler2);
      document.removeEventListener('timingTest', handler3);
      addLog('事件监听器已清理');
    }, 100);
  };

  // 测试3: DOM操作时序
  const testDOMTiming = () => {
    startTimeRef.current = Date.now();
    addLog('🧪 开始DOM操作时序测试', false);
    
    addLog('第1步: 创建DOM元素');
    const div = document.createElement('div');
    div.id = 'timing-test-element';
    div.textContent = 'Test Element';
    
    addLog('第2步: 添加到DOM');
    document.body.appendChild(div);
    
    addLog('第3步: 修改DOM内容');
    div.textContent = 'Modified Test Element';
    
    addLog('第4步: 异步DOM操作');
    setTimeout(() => {
      div.style.color = 'red';
      addLog('异步DOM修改完成');
    }, 0);
    
    addLog('第5步: 微任务DOM操作');
    Promise.resolve().then(() => {
      div.style.fontSize = '14px';
      addLog('微任务DOM修改完成');
    });
    
    // 清理
    setTimeout(() => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
        addLog('DOM元素已清理');
      }
    }, 200);
    
    addLog('DOM测试函数执行完毕');
  };

  // 测试4: 模拟SpeechRecognition时序
  const testSpeechRecognitionTiming = () => {
    startTimeRef.current = Date.now();
    addLog('🧪 开始SpeechRecognition时序测试', false);
    
    try {
      addLog('第1步: 检查SpeechRecognition支持');
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        addLog('❌ SpeechRecognition不支持');
        return;
      }
      
      addLog('第2步: 创建SpeechRecognition实例');
      const recognition = new SpeechRecognition();
      
      addLog('第3步: 设置事件处理器');
      recognition.onstart = () => addLog('recognition.onstart触发');
      recognition.onend = () => addLog('recognition.onend触发');
      recognition.onerror = (event: any) => addLog(`recognition.onerror触发: ${event.error}`);
      recognition.onresult = () => addLog('recognition.onresult触发');
      
      addLog('第4步: 开始语音识别');
      recognition.start();
      
      addLog('第5步: 立即停止语音识别');
      setTimeout(() => {
        try {
          recognition.stop();
          addLog('recognition.stop()调用完成');
        } catch (error: any) {
          addLog(`停止识别时出错: ${error.message}`);
        }
      }, 100);
      
      addLog('SpeechRecognition测试函数执行完毕');
      
    } catch (error: any) {
      addLog(`❌ SpeechRecognition测试失败: ${error.message}`);
    }
  };

  // 测试5: 综合时序测试（最危险）
  const testCombinedTiming = () => {
    startTimeRef.current = Date.now();
    addLog('🧪 开始综合时序测试 (可能崩溃)', false);
    
    // 同时进行多种操作
    addLog('第1步: 同步操作组合');
    
    // React状态更新
    setLogs(prev => [...prev, '[综合测试] React状态更新']);
    
    // DOM操作
    const div = document.createElement('div');
    document.body.appendChild(div);
    
    // 事件发射
    const event = new CustomEvent('combinedTest');
    document.dispatchEvent(event);
    
    addLog('第2步: 异步操作组合');
    
    // 异步React状态更新
    setTimeout(() => {
      setLogs(prev => [...prev, '[综合测试] 异步React状态更新']);
      addLog('异步React更新完成');
    }, 0);
    
    // 异步DOM操作
    setTimeout(() => {
      div.textContent = 'Async DOM update';
      addLog('异步DOM更新完成');
    }, 0);
    
    // 异步事件发射
    setTimeout(() => {
      const asyncEvent = new CustomEvent('combinedAsyncTest');
      document.dispatchEvent(asyncEvent);
      addLog('异步事件发射完成');
    }, 0);
    
    addLog('第3步: 微任务操作组合');
    
    Promise.resolve().then(() => {
      setLogs(prev => [...prev, '[综合测试] 微任务React状态更新']);
      addLog('微任务React更新完成');
    });
    
    Promise.resolve().then(() => {
      div.style.color = 'blue';
      addLog('微任务DOM更新完成');
    });
    
    // 清理
    setTimeout(() => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
    }, 500);
    
    addLog('综合测试函数执行完毕');
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            ⏱️ 时序分析测试
          </h2>
          <button onClick={onClose} style={closeButtonStyle}>关闭</button>
        </div>
        
        <p style={{ color: '#666', marginBottom: '20px' }}>
          精确分析异步操作时序，找出崩溃的根本原因
        </p>

        {/* 测试按钮 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button onClick={testReactTiming} style={testButtonStyle}>
            1. React状态时序
          </button>
          <button onClick={testEventListenerTiming} style={testButtonStyle}>
            2. 事件监听时序
          </button>
          <button onClick={testDOMTiming} style={testButtonStyle}>
            3. DOM操作时序
          </button>
          <button onClick={testSpeechRecognitionTiming} style={testButtonStyle}>
            4. 语音识别时序
          </button>
          <button onClick={testCombinedTiming} style={{...testButtonStyle, backgroundColor: '#e53e3e', gridColumn: 'span 2'}}>
            5. 综合时序测试 ⚠️ (可能崩溃)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={clearLogs} style={{...testButtonStyle, backgroundColor: '#666'}}>
            🧹 清空日志
          </button>
        </div>

        {/* 日志显示 */}
        <div style={{ 
          height: '400px', 
          border: '2px solid #ddd', 
          borderRadius: '8px', 
          padding: '15px',
          backgroundColor: '#f8f9fa',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '11px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', paddingTop: '100px' }}>
              点击测试按钮开始分析...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '3px', 
                color: log.includes('❌') ? '#e53e3e' : log.includes('✅') ? '#38a169' : '#333',
                borderLeft: log.includes('第') ? '3px solid #3182ce' : 'none',
                paddingLeft: log.includes('第') ? '8px' : '0'
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

const testButtonStyle = {
  padding: '10px 15px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#3182ce',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 'bold'
};

const closeButtonStyle = {
  background: '#e53e3e',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '8px 16px'
};

export default TimingAnalysisTest;