import React from 'react';
import { createPortal } from 'react-dom';

interface NoEventBusTestProps {
  visible: boolean;
  onClose: () => void;
}

const NoEventBusTest: React.FC<NoEventBusTestProps> = ({ visible, onClose }) => {
  if (!visible) {
    return null;
  }

  // 完全不使用EventBus的测试
  const handleTest1 = () => {
    console.log('🧪 测试1：纯console.log');
  };

  const handleTest2 = () => {
    console.log('🧪 测试2：创建简单自定义事件');
    try {
      const event = new CustomEvent('simpleTest');
      document.dispatchEvent(event);
      console.log('✅ 自定义事件调度成功');
    } catch (error) {
      console.error('❌ 自定义事件调度失败:', error);
    }
  };

  const handleTest3 = () => {
    console.log('🧪 测试3：DOM操作');
    try {
      const testDiv = document.createElement('div');
      testDiv.textContent = 'Test DOM operation';
      document.body.appendChild(testDiv);
      setTimeout(() => {
        document.body.removeChild(testDiv);
      }, 1000);
      console.log('✅ DOM操作成功');
    } catch (error) {
      console.error('❌ DOM操作失败:', error);
    }
  };

  const handleTest4 = () => {
    console.log('🧪 测试4：尝试创建SpeechRecognition对象');
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        console.log('✅ SpeechRecognition对象创建成功');
        recognition.abort(); // 立即停止
      } else {
        console.log('⚠️ 浏览器不支持SpeechRecognition');
      }
    } catch (error) {
      console.error('❌ SpeechRecognition创建失败:', error);
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
          padding: '40px',
          width: '500px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🧪 无EventBus崩溃测试
        </h2>
        
        <p style={{ color: '#666', marginBottom: '30px' }}>
          逐步测试各个功能点，找出崩溃原因
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <button onClick={handleTest1} style={buttonStyle}>
            测试1: 日志输出
          </button>
          
          <button onClick={handleTest2} style={buttonStyle}>
            测试2: 自定义事件
          </button>
          
          <button onClick={handleTest3} style={buttonStyle}>
            测试3: DOM操作
          </button>
          
          <button onClick={handleTest4} style={buttonStyle}>
            测试4: SpeechRecognition
          </button>
        </div>
        
        <button onClick={onClose} style={{
          ...buttonStyle,
          backgroundColor: '#ff4d4f',
          width: '100%'
        }}>
          关闭测试
        </button>
      </div>
    </div>,
    document.body
  );
};

const buttonStyle = {
  padding: '10px 15px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#1890ff',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px'
};

export default NoEventBusTest;