import React from 'react';
import { createPortal } from 'react-dom';
import { EventBus } from '../../../shared/utils/EventBus';

interface EventBusTestProps {
  visible: boolean;
  onClose: () => void;
}

const EventBusTest: React.FC<EventBusTestProps> = ({ visible, onClose }) => {
  if (!visible) {
    return null;
  }

  const handleTest1 = () => {
    console.log('🧪 测试1：EventBus.emit无参数');
    try {
      EventBus.emit('test-event');
      console.log('✅ 无参数EventBus.emit成功');
    } catch (error) {
      console.error('❌ 无参数EventBus.emit失败:', error);
    }
  };

  const handleTest2 = () => {
    console.log('🧪 测试2：EventBus.emit简单字符串');
    try {
      EventBus.emit('test-event', 'simple string');
      console.log('✅ 简单字符串EventBus.emit成功');
    } catch (error) {
      console.error('❌ 简单字符串EventBus.emit失败:', error);
    }
  };

  const handleTest3 = () => {
    console.log('🧪 测试3：EventBus.emit简单对象');
    try {
      EventBus.emit('test-event', { message: 'test', timestamp: Date.now() });
      console.log('✅ 简单对象EventBus.emit成功');
    } catch (error) {
      console.error('❌ 简单对象EventBus.emit失败:', error);
    }
  };

  const handleTest4 = () => {
    console.log('🧪 测试4：EventBus.emit复杂对象');
    try {
      const complexObj = {
        message: 'test',
        data: new Date(),
        nested: {
          prop1: 'value1',
          prop2: 123
        }
      };
      EventBus.emit('test-event', complexObj);
      console.log('✅ 复杂对象EventBus.emit成功');
    } catch (error) {
      console.error('❌ 复杂对象EventBus.emit失败:', error);
    }
  };

  const handleTest5 = () => {
    console.log('🧪 测试5：EventBus.emit speech:started (真实场景)');
    try {
      EventBus.emit('speech:started');
      console.log('✅ speech:started EventBus.emit成功');
    } catch (error) {
      console.error('❌ speech:started EventBus.emit失败:', error);
    }
  };

  const handleTest6 = () => {
    console.log('🧪 测试6：直接CustomEvent和dispatchEvent');
    try {
      const event = new CustomEvent('speechStart');  
      document.dispatchEvent(event);
      console.log('✅ 直接CustomEvent成功');
    } catch (error) {
      console.error('❌ 直接CustomEvent失败:', error);
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
          width: '600px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🧪 EventBus崩溃测试
        </h2>
        
        <p style={{ color: '#666', marginBottom: '30px' }}>
          逐步测试EventBus功能，找出崩溃原因
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <button onClick={handleTest1} style={buttonStyle}>
            测试1: 无参数emit
          </button>
          
          <button onClick={handleTest2} style={buttonStyle}>
            测试2: 字符串emit
          </button>
          
          <button onClick={handleTest3} style={buttonStyle}>
            测试3: 简单对象emit
          </button>
          
          <button onClick={handleTest4} style={buttonStyle}>
            测试4: 复杂对象emit
          </button>
          
          <button onClick={handleTest5} style={{...buttonStyle, backgroundColor: '#ff4d4f'}}>
            测试5: speech:started
          </button>
          
          <button onClick={handleTest6} style={buttonStyle}>
            测试6: 直接CustomEvent
          </button>
        </div>
        
        <button onClick={onClose} style={{
          ...buttonStyle,
          backgroundColor: '#666',
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

export default EventBusTest;