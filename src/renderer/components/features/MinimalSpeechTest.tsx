import React from 'react';
import { createPortal } from 'react-dom';

interface MinimalSpeechTestProps {
  visible: boolean;
  onClose: () => void;
}

const MinimalSpeechTest: React.FC<MinimalSpeechTestProps> = ({ visible, onClose }) => {
  if (!visible) {
    return null;
  }

  // 最简单的按钮点击测试
  const handleTestClick = () => {
    console.log('🧪 最小测试：按钮点击');
    
    try {
      // 创建一个自定义事件（完全不涉及语音）
      const testEvent = new CustomEvent('minimalTest', { 
        detail: { message: 'test' } 
      });
      document.dispatchEvent(testEvent);
      console.log('✅ 自定义事件发送成功');
    } catch (error) {
      console.error('❌ 自定义事件发送失败:', error);
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
          width: '400px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🧪 最小崩溃测试
        </h2>
        
        <p style={{ color: '#666', marginBottom: '30px' }}>
          这是一个最简单的测试，不涉及任何语音功能
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleTestClick}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#1890ff',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            🧪 测试按钮
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MinimalSpeechTest;