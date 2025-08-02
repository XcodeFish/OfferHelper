import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SpeechService } from '../../services/SpeechService';
import { EventBus } from '../../../shared/utils/EventBus';

interface UltimateSpeechDebuggerProps {
  visible: boolean;
  onClose: () => void;
}

const UltimateSpeechDebugger: React.FC<UltimateSpeechDebuggerProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const speechServiceRef = useRef<SpeechService | null>(null);
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  if (!visible) {
    return null;
  }

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const now = Date.now();
    const timeStr = startTimeRef.current ? `+${now - startTimeRef.current}ms` : new Date().toLocaleTimeString();
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    const logMessage = `[${timeStr}] ${emoji} ${message}`;
    
    console.log(`[UltimateDebugger] ${logMessage}`);
    setLogs(prev => [...prev.slice(-40), logMessage]);
  };

  const clearLogs = () => {
    setLogs([]);
    startTimeRef.current = 0;
  };

  // 测试1: 检查SpeechRecognition详细信息
  const testSpeechRecognitionDetails = () => {
    startTimeRef.current = Date.now();
    addLog('🔍 开始详细检查SpeechRecognition');
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        addLog('SpeechRecognition不可用', 'error');
        return;
      }
      
      addLog('SpeechRecognition可用', 'success');
      
      // 检查构造函数
      addLog(`构造函数名称: ${SpeechRecognition.name}`);
      addLog(`构造函数类型: ${typeof SpeechRecognition}`);
      
      // 创建实例并检查属性
      const recognition = new SpeechRecognition();
      addLog('SpeechRecognition实例创建成功', 'success');
      
      // 检查所有属性
      const props = Object.getOwnPropertyNames(recognition);
      addLog(`实例属性数量: ${props.length}`);
      
      // 检查关键属性
      const keyProps = ['continuous', 'interimResults', 'lang', 'maxAlternatives', 'serviceURI'];
      keyProps.forEach(prop => {
        if (prop in recognition) {
          addLog(`${prop}: ${recognition[prop]} (${typeof recognition[prop]})`);
        } else {
          addLog(`${prop}: 不存在`, 'warning');
        }
      });
      
      // 检查事件处理器
      const eventProps = ['onstart', 'onend', 'onerror', 'onresult', 'onnomatch', 'onsoundstart', 'onsoundend', 'onspeechstart', 'onspeechend'];
      eventProps.forEach(prop => {
        addLog(`${prop}: ${typeof recognition[prop]}`);
      });
      
      recognition.abort();
      addLog('SpeechRecognition实例已销毁', 'success');
      
    } catch (error: any) {
      addLog(`检查SpeechRecognition失败: ${error.message}`, 'error');
      addLog(`错误堆栈: ${error.stack}`, 'error');
    }
  };

  // 测试2: 逐步创建SpeechService
  const testSpeechServiceCreation = () => {
    startTimeRef.current = Date.now();
    addLog('🔍 开始逐步创建SpeechService');
    
    try {
      addLog('步骤1: 调用SpeechService构造函数');
      const service = new SpeechService();
      speechServiceRef.current = service;
      addLog('SpeechService构造函数完成', 'success');
      
      addLog('步骤2: 检查SpeechService属性');
      // 通过类型断言访问私有属性进行调试
      const serviceAny = service as any;
      addLog(`recognition: ${typeof serviceAny.recognition}`);
      addLog(`isListening: ${serviceAny.isListening}`);
      addLog(`config: ${JSON.stringify(serviceAny.config)}`);
      addLog(`speechProvider: ${serviceAny.speechProvider}`);
      
      addLog('步骤3: 设置provider');
      service.setProvider('browser');
      addLog('Provider设置完成', 'success');
      
      addLog('步骤4: 检查provider设置后的状态');
      addLog(`speechProvider after set: ${serviceAny.speechProvider}`);
      
    } catch (error: any) {
      addLog(`创建SpeechService失败: ${error.message}`, 'error');
      addLog(`错误堆栈: ${error.stack}`, 'error');
    }
  };

  // 测试3: 手动创建和配置SpeechRecognition
  const testManualSpeechRecognition = () => {
    startTimeRef.current = Date.now();
    addLog('🔍 开始手动创建SpeechRecognition');
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      addLog('步骤1: 创建SpeechRecognition实例');
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      addLog('实例创建成功', 'success');
      
      addLog('步骤2: 设置基本配置');
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      recognition.maxAlternatives = 1;
      addLog('基本配置完成', 'success');
      
      addLog('步骤3: 设置事件处理器 (逐个设置)');
      
      recognition.onstart = () => {
        addLog('recognition.onstart 触发', 'success');
      };
      addLog('onstart 处理器设置完成');
      
      recognition.onend = () => {
        addLog('recognition.onend 触发', 'success');
      };
      addLog('onend 处理器设置完成');
      
      recognition.onerror = (event: any) => {
        addLog(`recognition.onerror 触发: ${event.error}`, 'error');
        addLog(`错误详情: ${JSON.stringify(event)}`, 'error');
      };
      addLog('onerror 处理器设置完成');
      
      recognition.onresult = (event: any) => {
        addLog('recognition.onresult 触发', 'success');
        if (event.results && event.results.length > 0) {
          const result = event.results[event.results.length - 1];
          if (result[0]) {
            addLog(`识别结果: ${result[0].transcript}`, 'success');
          }
        }
      };
      addLog('onresult 处理器设置完成');
      
      // 设置其他事件处理器
      recognition.onnomatch = () => addLog('recognition.onnomatch 触发', 'warning');
      recognition.onsoundstart = () => addLog('recognition.onsoundstart 触发');
      recognition.onsoundend = () => addLog('recognition.onsoundend 触发');
      recognition.onspeechstart = () => addLog('recognition.onspeechstart 触发');
      recognition.onspeechend = () => addLog('recognition.onspeechend 触发');
      
      addLog('所有事件处理器设置完成', 'success');
      
      addLog('步骤4: 准备启动识别 (3秒后自动停止)');
      setTimeout(() => {
        try {
          addLog('调用 recognition.start()');
          recognition.start();
          addLog('recognition.start() 调用完成', 'success');
          
          // 3秒后停止
          setTimeout(() => {
            try {
              addLog('调用 recognition.stop()');
              recognition.stop();
              addLog('recognition.stop() 调用完成', 'success');
            } catch (stopError: any) {
              addLog(`停止识别失败: ${stopError.message}`, 'error');
            }
          }, 3000);
          
        } catch (startError: any) {
          addLog(`启动识别失败: ${startError.message}`, 'error');
          addLog(`启动错误堆栈: ${startError.stack}`, 'error');
        }
      }, 1000);
      
    } catch (error: any) {
      addLog(`手动SpeechRecognition失败: ${error.message}`, 'error');
      addLog(`错误堆栈: ${error.stack}`, 'error');
    }
  };

  // 测试4: 完全隔离的语音识别测试
  const testIsolatedSpeechRecognition = () => {
    startTimeRef.current = Date.now();
    addLog('🔍 开始隔离环境语音识别测试');
    
    // 在完全隔离的环境中测试
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    try {
      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) {
        throw new Error('无法创建隔离环境');
      }
      
      addLog('隔离环境创建成功', 'success');
      
      // 在iframe中执行语音识别代码
      const script = iframeWindow.document.createElement('script');
      script.textContent = `
        try {
          console.log('隔离环境：开始测试');
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.onstart = () => console.log('隔离环境：onstart');
            recognition.onerror = (e) => console.log('隔离环境：onerror', e.error);
            recognition.onend = () => console.log('隔离环境：onend');
            
            recognition.start();
            setTimeout(() => recognition.stop(), 1000);
            
            parent.postMessage({ type: 'isolated-test', status: 'success' }, '*');
          } else {
            parent.postMessage({ type: 'isolated-test', status: 'no-support' }, '*');
          }
        } catch (error) {
          parent.postMessage({ type: 'isolated-test', status: 'error', message: error.message }, '*');
        }
      `;
      
      // 监听iframe消息
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'isolated-test') {
          addLog(`隔离测试结果: ${event.data.status}`, event.data.status === 'success' ? 'success' : 'error');
          if (event.data.message) {
            addLog(`隔离测试错误: ${event.data.message}`, 'error');
          }
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      iframeWindow.document.head.appendChild(script);
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(iframe);
        addLog('隔离环境已清理');
      }, 5000);
      
    } catch (error: any) {
      addLog(`隔离测试失败: ${error.message}`, 'error');
      document.body.removeChild(iframe);
    }
  };

  // 测试5: 使用真实SpeechService测试
  const testRealSpeechService = () => {
    startTimeRef.current = Date.now();
    addLog('🔍 开始真实SpeechService测试 (可能崩溃)');
    setIsActive(true);
    
    try {
      if (!speechServiceRef.current) {
        const service = new SpeechService();
        speechServiceRef.current = service;
        service.setProvider('browser');
        addLog('SpeechService创建并配置完成', 'success');
      }
      
      const service = speechServiceRef.current;
      
      addLog('准备调用 startListening()');
      
      // 异步调用以避免阻塞日志
      setTimeout(async () => {
        try {
          await service.startListening();
          addLog('startListening() 调用成功', 'success');
          
          // 3秒后停止
          setTimeout(() => {
            try {
              service.stopListening();
              addLog('stopListening() 调用成功', 'success');
              setIsActive(false);
            } catch (stopError: any) {
              addLog(`停止失败: ${stopError.message}`, 'error');
              setIsActive(false);
            }
          }, 3000);
          
        } catch (startError: any) {
          addLog(`启动失败: ${startError.message}`, 'error');
          addLog(`启动错误堆栈: ${startError.stack}`, 'error');
          setIsActive(false);
        }
      }, 500);
      
    } catch (error: any) {
      addLog(`真实测试失败: ${error.message}`, 'error');
      addLog(`错误堆栈: ${error.stack}`, 'error');
      setIsActive(false);
    }
  };

  // 紧急停止
  const emergencyStop = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (speechServiceRef.current) {
        speechServiceRef.current.stopListening();
      }
      setIsActive(false);
      addLog('紧急停止完成', 'warning');
    } catch (error: any) {
      addLog(`紧急停止失败: ${error.message}`, 'error');
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
          width: '1000px',
          maxHeight: '95vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            🔬 终极语音识别调试器
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
        
        <p style={{ color: '#666', marginBottom: '20px' }}>
          深度分析语音识别的每一个细节，精确定位崩溃原因
        </p>

        {/* 测试按钮 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button onClick={testSpeechRecognitionDetails} style={buttonStyle}>
            1. 检查 SpeechRecognition 详情
          </button>
          <button onClick={testSpeechServiceCreation} style={buttonStyle}>
            2. 逐步创建 SpeechService
          </button>
          <button onClick={testManualSpeechRecognition} style={buttonStyle}>
            3. 手动 SpeechRecognition
          </button>
          <button onClick={testIsolatedSpeechRecognition} style={buttonStyle}>
            4. 隔离环境测试
          </button>
          <button 
            onClick={testRealSpeechService} 
            disabled={isActive}
            style={{
              ...buttonStyle, 
              backgroundColor: isActive ? '#ccc' : '#e53e3e', 
              gridColumn: 'span 2',
              cursor: isActive ? 'not-allowed' : 'pointer'
            }}
          >
            5. 真实 SpeechService 测试 ⚠️ {isActive ? '(运行中...)' : '(可能崩溃)'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={clearLogs} style={{...buttonStyle, backgroundColor: '#666'}}>
            🧹 清空日志
          </button>
        </div>

        {/* 实时日志 */}
        <div style={{ 
          height: '500px', 
          border: '2px solid #ddd', 
          borderRadius: '8px', 
          padding: '15px',
          backgroundColor: '#000',
          color: '#00ff00',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '11px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', paddingTop: '200px' }}>
              终极调试器就绪...选择测试开始深度分析
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '2px',
                color: log.includes('❌') ? '#ff4444' : 
                      log.includes('✅') ? '#44ff44' : 
                      log.includes('⚠️') ? '#ffff44' : '#00ff00',
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
  padding: '10px 15px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#3182ce',
  color: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 'bold'
};

export default UltimateSpeechDebugger;