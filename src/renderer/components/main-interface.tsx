import React, { useState, useEffect, useRef } from 'react';
import './main-interface.css';
import { TencentSpeechRecognizer } from '../services/tencent-speech-recognizer';
import { getTencentConfig, validateTencentConfig } from '../config/tencent-config';
import { glmService, GLMResponse } from '../services/glm-service';
import DebugPanel from './debug-panel';

interface MainInterfaceProps {
  user: { email: string } | null;
  onLogout: () => void;
  onShowSettings: () => void;
}

interface VoiceState {
  isListening: boolean;
  volume: number[];
  status: string;
}

const MainInterface: React.FC<MainInterfaceProps> = ({ user, onLogout, onShowSettings }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    volume: [0, 0, 0, 0, 0],
    status: '待机中...'
  });
  
  const [currentMode, setCurrentMode] = useState<'simple' | 'normal' | 'detailed'>('normal');
  const [opacity, setOpacity] = useState(90);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<TencentSpeechRecognizer | null>(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [isConfigValid, setIsConfigValid] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isGLMConfigured, setIsGLMConfigured] = useState(false);
  const [glmResponseTime, setGlmResponseTime] = useState<number>(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const questionPlaceholder = '识别到的问题文本会显示在这里...';
  const answerPlaceholder = 'AI生成的回答内容会显示在这里...';

  // 窗口控制函数
  const handleClose = () => {
    if (window.electronAPI?.window) {
      window.electronAPI.window.close();
    }
  };

  const handleMinimize = () => {
    if (window.electronAPI?.window) {
      window.electronAPI.window.minimize();
    }
  };

  const handleHide = () => {
    if (window.electronAPI?.window) {
      window.electronAPI.window.hide();
    }
  };

  // 初始化语音识别器和GLM服务
  const initializeServices = async () => {
    try {
      // 初始化语音识别器
      const config = await getTencentConfig();
      const isValid = validateTencentConfig(config);
      setIsConfigValid(isValid);

      if (!isValid) {
        console.warn('腾讯云配置无效，请在环境变量中配置正确的 TENCENT_APP_ID、TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY');
      } else {
        const recognizer = new TencentSpeechRecognizer({
          appId: config.appId,
          secretId: config.secretId,
          secretKey: config.secretKey,
          engineModelType: '16k_zh',
          voiceFormat: 1
        });

        // 设置识别事件回调
        recognizer.setCallbacks(
          async (result) => {
            console.log('识别结果:', result);
            if (result.result && result.result.voice_text_str) {
              const text = result.result.voice_text_str;
              setRecognizedText(text);
              setQuestion(text);
              
              // 如果是最终结果且GLM配置有效，发送给AI处理
              if (result.final === 1 && isGLMConfigured && currentSessionId) {
                await handleVoiceToAI(text);
              }
            }
          },
          (error) => {
            console.error('识别错误:', error);
            setVoiceState(prev => ({
              ...prev,
              isListening: false,
              status: '识别出错'
            }));
            setIsInterviewStarted(false);
          },
          (status) => {
            console.log('状态变化:', status);
            setVoiceState(prev => ({
              ...prev,
              status: status
            }));
          }
        );

        setSpeechRecognizer(recognizer);
      }

      // 检查GLM配置
      const glmStatus = await glmService.getConfigStatus();
      setIsGLMConfigured(glmStatus.isConfigured);
      
      if (!glmStatus.isConfigured) {
        console.warn('GLM配置无效，请检查AI_API_KEY等环境变量');
      } else {
        console.log('GLM服务配置有效，模型:', glmStatus.model);
      }

    } catch (error) {
      console.error('初始化服务失败:', error);
      setIsConfigValid(false);
      setIsGLMConfigured(false);
    }
  };

  // 处理语音转AI回复
  const handleVoiceToAI = async (voiceText: string) => {
    if (!currentSessionId || !voiceText.trim()) {
      return;
    }

    try {
      setIsGenerating(true);
      setAnswer('');

      console.log('发送语音文本到GLM:', voiceText);

      const response: GLMResponse = await glmService.sendMessage(
        currentSessionId,
        voiceText,
        {
          temperature: 0.3,
          maxTokens: 500,
          audioSource: true
        }
      );

      setGlmResponseTime(response.responseTime);
      
      // 模拟打字机效果显示AI回复
      let i = 0;
      const content = response.content;
      const typeInterval = setInterval(() => {
        if (content[i] === '\n') {
          setAnswer(prev => prev + '\n');
        } else {
          setAnswer(prev => prev + content[i]);
        }
        i++;
        
        if (i >= content.length) {
          clearInterval(typeInterval);
          setIsGenerating(false);
        }
      }, 30);

    } catch (error) {
      console.error('AI处理语音失败:', error);
      setIsGenerating(false);
      setAnswer('抱歉，AI处理出现错误，请稍后重试。');
    }
  };

  // 开始面试
  const startInterview = async () => {
    try {
      if (!isConfigValid) {
        alert('腾讯云配置无效，请检查配置文件');
        return;
      }

      if (!speechRecognizer) {
        alert('语音识别器未初始化');
        return;
      }

      setIsInterviewStarted(true);
      setVoiceState(prev => ({
        ...prev,
        isListening: true,
        status: '正在启动面试...'
      }));

      // 清空之前的识别结果
      setRecognizedText('');
      setQuestion('');
      setAnswer('');

      // 如果GLM配置有效，创建新的对话会话
      if (isGLMConfigured) {
        try {
          const sessionId = await glmService.createSession('general');
          setCurrentSessionId(sessionId);
          console.log('GLM会话创建成功:', sessionId);
        } catch (error) {
          console.error('创建GLM会话失败:', error);
          // 即使GLM会话创建失败，也可以继续语音识别
        }
      }

      // 启动腾讯语音识别
      await speechRecognizer.start();
      
      setVoiceState(prev => ({
        ...prev,
        status: '面试进行中...'
      }));
      
      console.log('面试已启动');
    } catch (error) {
      console.error('开始面试失败:', error);
      setIsInterviewStarted(false);
      setVoiceState(prev => ({
        ...prev,
        isListening: false,
        status: '启动失败'
      }));
      
      if (error instanceof Error) {
        alert(`启动面试失败: ${error.message}`);
      }
    }
  };

  // 结束面试
  const stopInterview = async () => {
    try {
      setIsInterviewStarted(false);
      setVoiceState(prev => ({
        ...prev,
        isListening: false,
        status: '正在停止语音识别...'
      }));

      // 停止腾讯语音识别
      if (speechRecognizer) {
        await speechRecognizer.stop();
        console.log('语音识别已停止');
      }

      setVoiceState(prev => ({
        ...prev,
        status: '待机中...'
      }));
    } catch (error) {
      console.error('结束面试失败:', error);
      setVoiceState(prev => ({
        ...prev,
        status: '停止失败'
      }));
    }
  };

  // 切换监听状态
  const toggleListening = () => {
    if (isInterviewStarted) {
      stopInterview();
    } else {
      startInterview();
    }
  };

  // 模式切换
  const handleModeChange = (mode: 'simple' | 'normal' | 'detailed') => {
    setCurrentMode(mode);
    if (question && question !== questionPlaceholder) {
      generateMockAnswer(question, mode);
    }
  };

  // 透明度控制
  const handleOpacityChange = async (value: number) => {
    setOpacity(value);
    try {
      if (window.electronAPI?.window) {
        const result = await window.electronAPI.window.setOpacity(value / 100);
        if (!result.success) {
          console.error('设置透明度失败:', result.error);
        }
      }
    } catch (error) {
      console.error('透明度设置错误:', error);
    }
  };

  // 复制回答
  const copyAnswer = () => {
    if (answer && answer !== answerPlaceholder) {
      navigator.clipboard.writeText(answer).then(() => {
        console.log('回答已复制到剪贴板');
      });
    }
  };

  // 清除内容
  const clearContent = () => {
    setQuestion('');
    setAnswer('');
    setRecognizedText('');
  };

  // 生成模拟回答
  const generateMockAnswer = (questionText: string, mode: 'simple' | 'normal' | 'detailed') => {
    const answers = {
      simple: {
        '请介绍一下你自己': '我是一名有3年经验的前端开发工程师，熟悉React和Vue框架。',
        '你为什么想要这份工作？': '贵公司的技术栈与我的专业技能高度匹配，我希望能在这里发挥所长。',
        '你的优势和劣势是什么？': '优势是学习能力强，劣势是有时过于追求完美。',
        '你对我们公司了解多少？': '贵公司是行业领先的科技企业，注重技术创新和人才培养。',
        '你的职业规划是什么？': '希望在技术领域深入发展，未来成为技术专家或团队负责人。'
      },
      normal: {
        '请介绍一下你自己': '我是一名有3年工作经验的前端开发工程师，主要使用React和Vue进行项目开发。在之前的工作中，我参与了多个大型项目的开发，具备良好的团队协作能力和问题解决能力。',
        '你为什么想要这份工作？': '首先，贵公司的技术栈与我的专业技能高度匹配，我能够快速融入团队。其次，我了解到贵公司有着良好的技术氛围和成长空间，这正是我所期望的工作环境。',
        '你的优势和劣势是什么？': '我的优势包括：学习能力强，能够快速掌握新技术；代码质量意识强，注重可维护性；团队协作能力好。劣势是有时候过于追求完美，可能会在细节上花费过多时间。',
        '你对我们公司了解多少？': '贵公司是行业内知名的科技企业，在技术创新方面有着卓越的表现。我了解到公司注重员工的技术成长，有完善的培训体系。',
        '你的职业规划是什么？': '短期内，我希望能够在现有技术栈的基础上，深入学习相关的后端技术，成为一名全栈开发工程师。中期目标是能够独立负责项目的技术架构设计。'
      },
      detailed: {
        '请介绍一下你自己': '我是一名有3年丰富工作经验的前端开发工程师，专精于现代JavaScript框架的应用开发。\n\n技术背景：\n- 熟练掌握React、Vue.js等主流前端框架\n- 具备TypeScript、ES6+等现代JavaScript开发经验\n- 熟悉Webpack、Vite等构建工具的配置和优化\n\n项目经验：\n- 参与过多个大型企业级项目的开发\n- 负责过移动端H5应用的架构设计\n- 有丰富的性能优化和用户体验提升经验',
        '你为什么想要这份工作？': '我选择贵公司主要基于以下几个方面的考虑：\n\n技术匹配度：贵公司使用的技术栈与我的专业技能高度匹配，我能够快速融入团队并发挥价值。\n\n发展前景：通过了解，贵公司在行业内有着良好的声誉和发展前景，这为我的职业发展提供了广阔的平台。\n\n企业文化：贵公司注重技术创新和人才培养的企业文化深深吸引着我，我希望能在这样的环境中持续成长。',
        '你的优势和劣势是什么？': '优势方面：\n1. 技术能力强：具备扎实的前端基础和丰富的项目经验\n2. 学习能力强：能够快速掌握新技术和适应技术变化\n3. 团队协作能力好：善于沟通，能够与不同角色的同事高效协作\n4. 问题解决能力强：面对复杂问题能够系统性分析并找到解决方案\n\n劣势方面：\n有时候过于追求完美，可能会在细节上花费过多时间，影响整体进度。不过我正在学习平衡完美与效率的关系。',
        '你对我们公司了解多少？': '通过多方面的了解，我对贵公司有以下认知：\n\n公司背景：贵公司是行业内知名的科技企业，在技术创新方面有着卓越的表现，产品在市场上有很好的口碑。\n\n技术实力：公司拥有强大的技术团队，在前沿技术的应用和研发方面走在行业前列。\n\n企业文化：注重员工的技术成长和职业发展，有完善的培训体系和晋升机制。',
        '你的职业规划是什么？': '我的职业规划分为短期、中期和长期三个阶段：\n\n短期规划（1-2年）：\n- 快速融入团队，熟悉公司的技术栈和业务流程\n- 在现有技术基础上，深入学习后端技术，向全栈方向发展\n- 参与重要项目，提升项目经验和技术能力\n\n中期规划（3-5年）：\n- 成为团队的技术骨干，能够独立负责项目的技术架构设计\n- 具备带领小团队的能力，承担一定的管理职责\n\n长期规划（5年以上）：\n- 成长为技术专家或技术管理者\n- 为公司的技术发展和团队建设贡献更大的价值'
      }
    };

    const answerText = answers[mode][questionText as keyof typeof answers[typeof mode]] || '抱歉，我需要更多时间来思考这个问题。';
    
    setIsGenerating(true);
    setAnswer('');
    
    setTimeout(() => {
      setIsGenerating(false);
      // 模拟打字机效果
      let i = 0;
      const typeInterval = setInterval(() => {
        if (answerText[i] === '\n') {
          setAnswer(prev => prev + '\n');
        } else {
          setAnswer(prev => prev + answerText[i]);
        }
        i++;
        
        if (i >= answerText.length) {
          clearInterval(typeInterval);
        }
      }, 30);
    }, 1500);
  };

  // 快捷键处理
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.shiftKey) {
          switch (e.key) {
            case 'S':
              e.preventDefault();
              toggleListening();
              break;
            case 'H':
              e.preventDefault();
              handleHide();
              break;
            case '1':
              e.preventDefault();
              handleModeChange('simple');
              break;
            case '2':
              e.preventDefault();
              handleModeChange('normal');
              break;
            case '3':
              e.preventDefault();
              handleModeChange('detailed');
              break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  // 初始化服务
  useEffect(() => {
    initializeServices();
    
    // 组件卸载时清理资源
    return () => {
      if (speechRecognizer) {
        speechRecognizer.destroy();
      }
      if (currentSessionId) {
        glmService.deleteSession(currentSessionId).catch(console.error);
      }
    };
  }, []);

  // 当语音识别器状态改变时更新音量可视化
  useEffect(() => {
    if (isInterviewStarted && speechRecognizer) {
      const interval = setInterval(() => {
        const status = speechRecognizer.getStatus();
        if (status.isRecording) {
          // 模拟音量变化
          setVoiceState(prev => ({
            ...prev,
            volume: Array.from({ length: 5 }, () => Math.random() * 100)
          }));
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isInterviewStarted, speechRecognizer]);

  return (
    <div className="main-container">
      {/* 标题栏 */}
      <div className="title-bar">
        <div className="window-controls">
          <button className="control-btn close" onClick={handleClose}></button>
          <button className="control-btn minimize" onClick={handleMinimize}></button>
          <button className="control-btn maximize"></button>
        </div>
        
        <div className="title-bar-buttons">
          <button className="title-btn" onClick={onShowSettings}>设置</button>
          <button className="title-btn" onClick={() => setShowDebugPanel(!showDebugPanel)}>
            调试
          </button>
          <button className="title-btn" onClick={handleHide}>隐藏</button>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-left">
          <div className="mic-status">
            <span className="mic-icon">🎤</span>
            <span>{voiceState.status}</span>
            <div className={`recording-indicator ${voiceState.isListening ? 'active' : ''}`}></div>
            {!isConfigValid && (
              <span style={{ color: '#ff6b6b', fontSize: '12px', marginLeft: '8px' }}>
                (语音识别配置无效)
              </span>
            )}
            {!isGLMConfigured && (
              <span style={{ color: '#ff9500', fontSize: '12px', marginLeft: '8px' }}>
                (GLM配置无效)
              </span>
            )}
            {isGLMConfigured && currentSessionId && (
              <span style={{ color: '#4CAF50', fontSize: '12px', marginLeft: '8px' }}>
                (AI已连接)
              </span>
            )}
          </div>
          
          <div className="volume-visualizer">
            {[0, 1, 2, 3, 4].map(i => (
              <div 
                key={i}
                className={`volume-bar ${voiceState.isListening ? 'active' : ''}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="status-right">
          <button 
            className={`interview-btn ${isInterviewStarted ? 'stop' : 'start'}`}
            onClick={toggleListening}
            disabled={!isConfigValid}
            style={{ 
              opacity: isConfigValid ? 1 : 0.5,
              cursor: isConfigValid ? 'pointer' : 'not-allowed'
            }}
          >
            {isInterviewStarted ? '结束面试' : '开始面试'}
          </button>
        </div>
      </div>

      {/* 问题区域 - 标记1：显示语音识别结果 */}
      <div className="question-area">
        <div className="question-text" style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {question || recognizedText || <span className="question-placeholder">{questionPlaceholder}</span>}
        </div>
      </div>

      {/* 回答区域 */}
      <div className="answer-area">
        <div className="answer-text">
          {isGenerating ? (
            <div><span className="loading-spinner"></span> AI正在生成回答...</div>
          ) : (
            answer ? (
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{answer}</pre>
            ) : (
              <span className="answer-placeholder">{answerPlaceholder}</span>
            )
          )}
        </div>
      </div>

      {/* 控制栏 */}
      <div className="control-bar">
        <div className="mode-buttons">
          {(['simple', 'normal', 'detailed'] as const).map(mode => (
            <button
              key={mode}
              className={`mode-btn ${currentMode === mode ? 'active' : ''}`}
              onClick={() => handleModeChange(mode)}
            >
              {mode === 'simple' ? '精简' : mode === 'normal' ? '普通' : '详细'}
            </button>
          ))}
        </div>
        
        <div className="action-buttons">
          <button className="action-btn" onClick={copyAnswer}>复制</button>
          <button className="action-btn" onClick={clearContent}>清除</button>
          {glmResponseTime > 0 && (
            <span className="response-time" style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginLeft: '8px' 
            }}>
              响应时间: {glmResponseTime}ms
            </span>
          )}
        </div>
      </div>

      {/* 透明度控制 */}
      <div className="opacity-control">
        <span className="opacity-label">透明度:</span>
        <input 
          type="range" 
          className="opacity-slider" 
          min="10" 
          max="100" 
          value={opacity}
          onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
        />
        <span className="opacity-value">{opacity}%</span>
      </div>

      {/* 调试面板 */}
      <DebugPanel 
        isVisible={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />
    </div>
  );
};

export default MainInterface;
