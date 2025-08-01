import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, Tag, Spin } from 'antd';
import { AudioOutlined, AudioMutedOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { EventBus } from '../../../shared/utils/EventBus';
import { speechService } from '../../services/SpeechService';
import type { SpeechResult, SpeechError } from '../../../shared/types/speech';

const { Text, Paragraph } = Typography;

interface SpeechMonitorProps {
  visible: boolean;
  onClose: () => void;
  provider: 'browser' | 'tencent';
}

/**
 * 语音监控组件
 * 用于测试和展示实时语音识别功能
 */
const SpeechMonitor: React.FC<SpeechMonitorProps> = ({ visible, onClose, provider }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);

  // 监听语音识别事件
  useEffect(() => {
    const handleStart = () => {
      setIsListening(true);
      setError(null);
    };

    const handleEnd = () => {
      setIsListening(false);
    };

    const handleInterim = (result: SpeechResult) => {
      setInterimTranscript(result.transcript);
      setConfidence(result.confidence);
    };

    const handleResult = (result: SpeechResult) => {
      setTranscript(prev => prev + (prev ? ' ' : '') + result.transcript);
      setInterimTranscript('');
      setConfidence(result.confidence);
    };

    const handleError = (err: SpeechError) => {
      setError(err.message);
      setIsListening(false);
    };

    // 注册事件监听
    EventBus.on('speech:started', handleStart);
    EventBus.on('speech:ended', handleEnd);
    EventBus.on('speech:interim', handleInterim);
    EventBus.on('speech:result', handleResult);
    EventBus.on('speech:error', handleError);

    // 组件卸载时清理
    return () => {
      EventBus.off('speech:started', handleStart);
      EventBus.off('speech:ended', handleEnd);
      EventBus.off('speech:interim', handleInterim);
      EventBus.off('speech:result', handleResult);
      EventBus.off('speech:error', handleError);
      
      // 如果正在监听，停止监听
      if (isListening) {
        speechService.stopListening();
      }
    };
  }, [isListening]);

  // 当对话框关闭时，停止监听
  useEffect(() => {
    if (!visible && isListening) {
      speechService.stopListening();
    }
    
    // 当对话框打开时，重置状态
    if (visible) {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
    }
  }, [visible, isListening]);

  // 切换语音识别状态
  const toggleListening = async () => {
    try {
      console.log('SpeechMonitor: 切换语音识别状态', { isListening, provider });
      
      if (isListening) {
        console.log('SpeechMonitor: 停止语音识别');
        speechService.stopListening();
      } else {
        console.log('SpeechMonitor: 开始语音识别');
        
        // 检查服务状态
        const status = speechService.getStatus();
        console.log('SpeechMonitor: 当前服务状态', status);
        
        // 确保使用正确的提供商
        speechService.setProvider(provider);
        console.log('SpeechMonitor: 设置语音识别提供商为', provider);
        
        await speechService.startListening();
        console.log('SpeechMonitor: 语音识别启动成功');
      }
    } catch (err) {
      console.error('SpeechMonitor: 语音识别操作失败', err);
      const errorMessage = err instanceof Error ? err.message : '启动语音识别失败';
      setError(errorMessage);
      
      // 如果是腾讯云服务失败，提供更详细的错误信息
      if (provider === 'tencent' && errorMessage.includes('未初始化')) {
        setError('腾讯云语音识别服务未初始化，请检查配置参数是否正确填写');
      }
    }
  };

  // 清空识别结果
  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <Modal
      title={`语音识别测试 (${provider === 'browser' ? '浏览器' : '腾讯云'})`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="clear" onClick={clearTranscript} disabled={!transcript && !interimTranscript}>
          清空结果
        </Button>,
        <Button
          key="toggle"
          type={isListening ? 'default' : 'primary'}
          icon={isListening ? <StopOutlined /> : <AudioOutlined />}
          onClick={toggleListening}
          loading={false}
          disabled={false}
        >
          {isListening ? '停止语音识别' : '开始语音识别'}
        </Button>
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 状态指示器 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text>状态:</Text>
            {isListening ? (
              <Tag color="green" icon={<Spin size="small" />}>
                正在监听...
              </Tag>
            ) : (
              <Tag color="default">未监听</Tag>
            )}
            {confidence > 0 && (
              <Tag color="blue">
                置信度: {Math.round(confidence * 100)}%
              </Tag>
            )}
          </Space>
        </div>

        {/* 错误信息 */}
        {error && (
          <div style={{ marginBottom: 16 }}>
            <Text type="danger">{error}</Text>
          </div>
        )}

        {/* 识别结果 */}
        <div
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            padding: 16,
            minHeight: 200,
            maxHeight: 300,
            overflowY: 'auto',
            backgroundColor: '#f5f5f5',
          }}
        >
          {transcript && <Paragraph>{transcript}</Paragraph>}
          {interimTranscript && (
            <Paragraph style={{ color: '#1890ff' }}>
              {interimTranscript}
            </Paragraph>
          )}
        {!transcript && !interimTranscript && (
          <Text type="secondary">
            点击"开始语音识别"按钮，然后开始说话...
          </Text>
        )}
        </div>

        {/* 使用说明 */}
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            提示: 请确保已授予麦克风权限，并在安静的环境中进行测试。
            {provider === 'tencent' && ' 腾讯云语音识别需要网络连接。'}
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default SpeechMonitor;