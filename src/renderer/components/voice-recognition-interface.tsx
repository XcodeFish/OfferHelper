/**
 * 语音识别界面组件
 * 提供完整的语音识别功能和实时结果显示
 */

import React, { useState, useEffect, useRef } from 'react';
import './voice-recognition-interface.css';

interface RecognitionResult {
  text: string;
  isFinal: boolean;
  timestamp: number;
  confidence?: number;
}

interface VoiceRecognitionInterfaceProps {
  onResult?: (result: RecognitionResult) => void;
  onError?: (error: any) => void;
}

export const VoiceRecognitionInterface: React.FC<VoiceRecognitionInterfaceProps> = ({
  onResult,
  onError
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [finalResults, setFinalResults] = useState<RecognitionResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);

  const recognizerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 初始化语音识别
  const initializeRecognizer = async () => {
    try {
      setError(null);
      setConnectionStatus('正在初始化...');

      // 获取配置 - 从环境变量或配置服务获取
      const configData = {
        appId: process.env.TENCENT_APP_ID || '',
        secretId: process.env.TENCENT_SECRET_ID || '',
        secretKey: process.env.TENCENT_SECRET_KEY || '',
        region: process.env.TENCENT_REGION || 'ap-beijing'
      };

      // 检查必要的配置是否存在
      if (!configData.appId || !configData.secretId || !configData.secretKey) {
        throw new Error('缺少必要的腾讯云配置信息，请检查环境变量设置');
      }

      setConfig(configData);
      console.log('配置加载成功:', { ...configData, secretKey: '***' });

      // 检查浏览器支持
      if (!window.navigator.mediaDevices || !window.navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持音频录制');
      }

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      mediaStreamRef.current = stream;

      // 创建音频上下文
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });

      setConnectionStatus('初始化完成');
      setIsConnected(true);
      console.log('语音识别初始化完成');

    } catch (err) {
      console.error('初始化失败:', err);
      const errorMessage = err instanceof Error ? err.message : '初始化失败';
      setError(errorMessage);
      setConnectionStatus('初始化失败');
      onError?.(err);
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      if (!isConnected) {
        await initializeRecognizer();
      }

      if (!mediaStreamRef.current || !audioContextRef.current) {
        throw new Error('音频设备未初始化');
      }

      setError(null);
      setCurrentText('');
      setConnectionStatus('正在连接...');

      // 创建腾讯云语音识别器
      const { VoiceRecognitionManager } = await import('../services/tencent-speech-recognizer');
      
      recognizerRef.current = new VoiceRecognitionManager({
        appid: config.appId,
        secretid: config.secretId,
        secretkey: config.secretKey,
        engine_model_type: '16k_zh',
        voice_format: 1
      });

      // 设置识别结果回调
      recognizerRef.current.onRecognitionStart = (res: any) => {
        console.log('[语音识别] 开始识别:', res);
        setConnectionStatus('识别中...');
      };

      recognizerRef.current.onSentenceBegin = (res: any) => {
        console.log('[语音识别] 句子开始:', res);
      };

      recognizerRef.current.onRecognitionResultChange = (res: any) => {
        console.log('[语音识别] 实时结果:', res);
        if (res.result && res.result.voice_text_str) {
          const text = res.result.voice_text_str;
          console.log('[语音识别] 实时文本:', text);
          setCurrentText(text);
        }
      };

      recognizerRef.current.onSentenceEnd = (res: any) => {
        console.log('[语音识别] 句子结束:', res);
        if (res.result && res.result.voice_text_str) {
          const text = res.result.voice_text_str;
          console.log('[语音识别] 最终文本:', text);
          
          const result: RecognitionResult = {
            text: text,
            isFinal: true,
            timestamp: Date.now(),
            confidence: res.result.confidence || 0.9
          };
          
          setFinalResults(prev => [...prev, result]);
          setCurrentText('');
          onResult?.(result);
        }
      };

      recognizerRef.current.onRecognitionComplete = (res: any) => {
        console.log('[语音识别] 识别完成:', res);
        setConnectionStatus('识别完成');
      };

      recognizerRef.current.onError = (error: any) => {
        console.error('[语音识别] 错误:', error);
        setError(error.message || '识别错误');
        setIsRecording(false);
        setConnectionStatus('识别错误');
        onError?.(error);
      };

      // 开始识别
      await recognizerRef.current.start();
      
      setConnectionStatus('识别中...');
      setIsRecording(true);
      console.log('语音识别启动成功');

    } catch (err) {
      console.error('开始录音失败:', err);
      const errorMessage = err instanceof Error ? err.message : '开始录音失败';
      setError(errorMessage);
      setIsRecording(false);
      setConnectionStatus('录音失败');
      onError?.(err);
    }
  };

  // 停止录音
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setConnectionStatus('正在停止...');

      if (recognizerRef.current) {
        recognizerRef.current.stop();
        recognizerRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setConnectionStatus('已停止');
      console.log('录音已停止');

    } catch (err) {
      console.error('停止录音失败:', err);
      setError(err instanceof Error ? err.message : '停止录音失败');
      onError?.(err);
    }
  };

  // 音频处理
  const startAudioProcessing = () => {
    if (!audioContextRef.current || !mediaStreamRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      if (!isRecording || !recognizerRef.current) return;

      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      
      // 转换为16位PCM
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }

      // 发送音频数据
      recognizerRef.current.write(pcmData.buffer);
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };

  // 清除结果
  const clearResults = () => {
    setFinalResults([]);
    setCurrentText('');
    setError(null);
  };

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  return (
    <div className="voice-recognition-interface">
      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-info">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '●' : '○'}
          </span>
          <span className="status-text">{connectionStatus}</span>
        </div>
        
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot">●</span>
            <span>录音中...</span>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="controls">
        <button
          className={`control-btn ${isRecording ? 'stop' : 'start'}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected && !isRecording}
        >
          {isRecording ? '停止录音' : '开始录音'}
        </button>
        
        <button
          className="control-btn secondary"
          onClick={initializeRecognizer}
          disabled={isRecording}
        >
          重新初始化
        </button>
        
        <button
          className="control-btn secondary"
          onClick={clearResults}
          disabled={isRecording}
        >
          清除结果
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* 实时识别结果 */}
      <div className="recognition-results">
        <h3>识别结果</h3>
        
        {/* 当前识别中的文本 */}
        {currentText && (
          <div className="current-text">
            <div className="text-label">正在识别:</div>
            <div className="text-content current">{currentText}</div>
          </div>
        )}

        {/* 最终识别结果 */}
        <div className="final-results">
          {finalResults.length === 0 ? (
            <div className="placeholder">识别到的问题文本会显示在这里...</div>
          ) : (
            finalResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-meta">
                  <span className="result-index">#{index + 1}</span>
                  <span className="result-time">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                  {result.confidence && (
                    <span className="result-confidence">
                      置信度: {(result.confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="result-text">{result.text}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 配置信息 */}
      {config && (
        <div className="config-info">
          <details>
            <summary>配置信息</summary>
            <div className="config-details">
              <p><strong>AppID:</strong> {config.appId}</p>
              <p><strong>SecretID:</strong> {config.secretId?.substring(0, 10)}...</p>
              <p><strong>Region:</strong> {config.region}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default VoiceRecognitionInterface;