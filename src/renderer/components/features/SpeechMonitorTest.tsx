import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SpeechService } from '../../services/SpeechService';

interface SpeechMonitorTestProps {
  visible: boolean;
  onClose: () => void;
  provider: 'browser' | 'tencent';
}

const SpeechMonitorTest: React.FC<SpeechMonitorTestProps> = ({ visible, onClose, provider }) => {
  const [error, setError] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>(['测试组件已加载']);
  const [testStep, setTestStep] = useState(0);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-10), `[${timestamp}] ${message}`]);
  };

  const handleClose = () => {
    addDebugLog('关闭对话框');
    onClose();
  };

  const runTest = async (step: number) => {
    setTestStep(step);
    setError('');
    
    try {
      switch (step) {
        case 1:
          addDebugLog('测试步骤1: 创建SpeechService实例');
          const speechService = new SpeechService();
          addDebugLog('✅ SpeechService实例创建成功');
          break;
          
        case 2:
          addDebugLog('测试步骤2: 设置语音提供商');
          const speechService2 = new SpeechService();
          speechService2.setProvider(provider);
          addDebugLog(`✅ 语音提供商设置为: ${provider}`);
          break;
          
        case 3:
          addDebugLog('测试步骤3: 检查语音服务状态');
          const speechService3 = new SpeechService();
          speechService3.setProvider(provider);
          const status = speechService3.getStatus();
          addDebugLog(`✅ 服务状态: isListening=${status.isListening}, isSupported=${status.isSupported}`);
          break;
          
        case 4:
          addDebugLog('测试步骤4: 测试事件系统 (不启动识别)');
          const speechService4 = new SpeechService();
          speechService4.setProvider(provider);
          
          // 添加临时事件监听器测试
          const testHandler = () => {
            addDebugLog('✅ 测试事件接收成功');
          };
          
          document.addEventListener('speechStart', testHandler);
          
          // 手动触发事件测试
          const testEvent = new CustomEvent('speechStart', { detail: 'test' });
          document.dispatchEvent(testEvent);
          
          // 清理
          document.removeEventListener('speechStart', testHandler);
          addDebugLog('✅ 事件系统测试完成');
          break;
          
        case 5:
          addDebugLog('测试步骤5: 测试EventBus (危险操作)');
          // 直接导入EventBus并测试
          const EventBusModule = await import('../../../shared/utils/EventBus');
          const EventBus = EventBusModule.EventBus;
          addDebugLog('✅ EventBus导入成功');
          
          // 测试发射事件（这可能是崩溃点）
          EventBus.emit('speech:test', { message: 'test' });
          addDebugLog('✅ EventBus.emit执行成功');
          break;
          
        case 6:
          addDebugLog('测试步骤6: 尝试启动语音识别 (最危险)');
          const speechService6 = new SpeechService();
          
          // 强制使用浏览器语音识别进行测试
          speechService6.setProvider('browser');
          addDebugLog('强制设置为浏览器语音识别');
          
          // 这是最可能崩溃的操作
          await speechService6.startListening();
          addDebugLog('✅ 语音识别启动成功！');
          
          // 立即停止
          speechService6.stopListening();
          addDebugLog('✅ 语音识别停止成功！');
          break;

        case 7:
          addDebugLog('测试步骤7: 完整语音识别+事件监听 (真实场景)');
          const speechService7 = new SpeechService();
          speechService7.setProvider('browser');
          
          let eventReceived = false;
          
          // 添加事件监听器（模拟SpeechMonitor的真实行为）
          const handleStart = () => {
            addDebugLog('✅ 收到speechStart事件');
            eventReceived = true;
          };
          
          const handleEnd = () => {
            addDebugLog('✅ 收到speechEnd事件');
          };
          
          const handleError = (event: any) => {
            addDebugLog(`❌ 收到speechError事件: ${event.detail?.error || event.error}`);
          };
          
          document.addEventListener('speechStart', handleStart);
          document.addEventListener('speechEnd', handleEnd);
          document.addEventListener('speechError', handleError);
          
          try {
            // 启动语音识别
            await speechService7.startListening();
            addDebugLog('✅ 语音识别启动成功');
            
            // 等待事件触发
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (eventReceived) {
              addDebugLog('✅ 事件系统工作正常');
            } else {
              addDebugLog('⚠️ 没有收到speechStart事件');
            }
            
            // 停止语音识别
            speechService7.stopListening();
            addDebugLog('✅ 完整测试成功！');
            
          } finally {
            // 清理事件监听器
            document.removeEventListener('speechStart', handleStart);
            document.removeEventListener('speechEnd', handleEnd);
            document.removeEventListener('speechError', handleError);
            addDebugLog('✅ 事件监听器已清理');
          }
          break;
          
        default:
          addDebugLog('❌ 未知测试步骤');
      }
    } catch (err: any) {
      const errorMsg = err.message || '测试失败';
      addDebugLog(`❌ 步骤${step}失败: ${errorMsg}`);
      setError(`步骤${step}失败: ${errorMsg}`);
    }
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
            🔬 语音识别逐步测试 ({provider})
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
          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>测试步骤:</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7].map(step => (
              <button
                key={step}
                onClick={() => runTest(step)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  backgroundColor: testStep === step ? '#1890ff' : 'white',
                  color: testStep === step ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                步骤 {step}
              </button>
            ))}
          </div>
        </div>

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
          fontSize: '12px',
          color: '#666',
          marginBottom: '16px',
          lineHeight: '1.4'
        }}>
          <strong>测试说明:</strong><br/>
          步骤1-3: 基础对象创建测试<br/>
          步骤4: 事件系统测试<br/>
          步骤5: EventBus测试<br/>
          步骤6: 语音识别启动测试<br/>
          步骤7: 完整语音识别+事件监听 (最真实)
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => setDebugLogs(['日志已清空'])}
            style={{
              padding: '10px 20px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer'
            }}
          >
            清空日志
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SpeechMonitorTest;