import React, { useState, useEffect } from 'react';
import { glmService } from '../services/glm-service';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const refreshDebugInfo = async () => {
    try {
      const configStatus = await glmService.getConfigStatus();
      setDebugInfo({
        configStatus,
        currentSessionId: glmService.getCurrentSessionId(),
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : '获取调试信息失败',
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const testGLMConnection = async () => {
    console.log('开始测试GLM连接...');
    setIsLoading(true);
    setTestResult('正在测试GLM连接...');
    
    try {
      console.log('调用glmService.testConnection()');
      const result = await glmService.testConnection();
      console.log('GLM连接测试结果:', result);
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('GLM连接测试错误:', error);
      setTestResult(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSendMessage = async () => {
    console.log('开始测试发送消息...');
    setIsLoading(true);
    setTestResult('正在测试发送消息...');
    
    try {
      // 创建测试会话
      console.log('创建测试会话...');
      const sessionId = await glmService.createSession('general');
      console.log('测试会话创建成功:', sessionId);
      
      // 发送测试消息
      console.log('发送测试消息...');
      const response = await glmService.sendMessage(sessionId, '你好，请简单回复一下', {
        temperature: 0.3,
        maxTokens: 50
      });
      console.log('消息发送成功:', response);
      
      setTestResult(`测试成功:\n${JSON.stringify(response, null, 2)}`);
      
      // 清理测试会话
      console.log('清理测试会话...');
      await glmService.deleteSession(sessionId);
      console.log('测试会话清理完成');
    } catch (error) {
      console.error('发送消息测试错误:', error);
      setTestResult(`发送消息测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      refreshDebugInfo();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      right: '10px',
      width: '400px',
      height: '500px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 1000,
      fontSize: '12px',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>GLM调试面板</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={refreshDebugInfo}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          刷新状态
        </button>
        
        <button 
          onClick={testGLMConnection}
          disabled={isLoading}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          测试连接
        </button>

        <button 
          onClick={testSendMessage}
          disabled={isLoading}
          style={{
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          测试消息
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>调试信息:</h4>
        <pre style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '11px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {testResult && (
        <div>
          <h4>测试结果:</h4>
          <pre style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;