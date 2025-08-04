import { VoiceRecognitionManager } from '../services/tencent-speech-recognizer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { generateResponse } from '../store/slices/ai-slice';
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
import './main-interface.css';

interface MainInterfaceProps {
  user: { email: string } | null;
  onLogout: () => void;
  onShowSettings: () => void;
}

<<<<<<< HEAD
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
const MainInterface: React.FC<MainInterfaceProps> = ({ user, onLogout, onShowSettings, onShowVoiceTest }) => {
  const dispatch = useAppDispatch();
  
  // 语音识别状态 - 从voice-test-simple迁移
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionText, setRecognitionText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [voiceManager, setVoiceManager] = useState<VoiceRecognitionManager | null>(null);
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
import React, { useState, useEffect, useRef } from 'react';
import { VoiceRecognitionManager } from '../services/tencent-speech-recognizer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { generateResponse } from '../store/slices/ai-slice';
import './main-interface.css';

interface MainInterfaceProps {
  user: { email: string } | null;
  onLogout: () => void;
  onShowSettings: () => void;
  onShowVoiceTest: () => void;
}

const MainInterface: React.FC<MainInterfaceProps> = ({ user, onLogout, onShowSettings, onShowVoiceTest }) => {
  const dispatch = useAppDispatch();
  
  // 语音识别状态 - 从voice-test-simple迁移
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionText, setRecognitionText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [voiceManager, setVoiceManager] = useState<VoiceRecognitionManager | null>(null);
=======
import { VoiceRecognitionManager } from '../services/tencent-speech-recognizer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { generateResponse } from '../store/slices/ai-slice';
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
import './main-interface.css';

interface MainInterfaceProps {
  user: { email: string } | null;
  onLogout: () => void;
  onShowSettings: () => void;
}

<<<<<<< HEAD
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
=======
const MainInterface: React.FC<MainInterfaceProps> = ({ user, onLogout, onShowSettings, onShowVoiceTest }) => {
  const dispatch = useAppDispatch();
  
  // 语音识别状态 - 从voice-test-simple迁移
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionText, setRecognitionText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [voiceManager, setVoiceManager] = useState<VoiceRecognitionManager | null>(null);
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
  
  const [currentMode, setCurrentMode] = useState<'simple' | 'normal' | 'detailed'>('normal');
  const [opacity, setOpacity] = useState(90);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const questionPlaceholder = '识别到的问题文本会显示在这里...';
  const answerPlaceholder = 'AI生成的回答内容会显示在这里...';

  // 窗口控制函数
  const handleClose = () => {
    if ((window as any).electronAPI?.window) {
      (window as any).electronAPI.window.close();
    }
  };

  const handleMinimize = () => {
    if ((window as any).electronAPI?.window) {
      (window as any).electronAPI.window.minimize();
    }
  };

  const handleHide = () => {
    if ((window as any).electronAPI?.window) {
      (window as any).electronAPI.window.hide();
    }
  };

  // 加载配置 - 从voice-test-simple迁移
  const loadConfig = async () => {
    try {
<<<<<<< HEAD
      setIsInterviewStarted(true);
      setVoiceState(prev => ({
        ...prev,
        isListening: true,
        status: '面试进行中...'
      }));

      // 调用语音服务开始录音
      if (window.electronAPI?.voice) {
        const result = await window.electronAPI.voice.startRecording();
        if (result.success) {
          console.log('语音录制已开始');
          // 开始模拟问题识别
          setTimeout(() => {
            simulateQuestionRecognition();
          }, 2000);
        } else {
          console.error('启动语音录制失败:', result.message);
        }
      }
    } catch (error) {
      console.error('开始面试失败:', error);
      setIsInterviewStarted(false);
      setVoiceState(prev => ({
        ...prev,
        isListening: false,
        status: '待机中...'
      }));
=======
      console.log('[UI] 开始加载配置...');
      
      // 先尝试从设置服务获取配置
      const configResponse = await (window as any).electronAPI.settings.get('voice');
      console.log('[UI] 设置服务响应:', configResponse);
      
      let config;
      
      if (configResponse.success && configResponse.settings && 
          configResponse.settings.appId && 
          configResponse.settings.secretId && 
          configResponse.settings.secretKey) {
        // 使用设置服务中的配置
        config = {
          appid: configResponse.settings.appId,
          secretid: configResponse.settings.secretId,
          secretkey: configResponse.settings.secretKey,
          engine_model_type: '16k_zh',
          voice_format: 1,
        };
        console.log('[UI] 使用设置服务配置');
      } else {
        // 使用环境变量配置作为后备
        console.log('[UI] 设置服务配置不完整，尝试使用环境变量...');
        
        try {
          const envConfigResponse = await (window as any).electronAPI.voice.getConfig();
          console.log('[UI] 环境变量配置响应:', envConfigResponse);
          
          if (envConfigResponse.success && envConfigResponse.data) {
            config = {
              appid: envConfigResponse.data.appId,
              secretid: envConfigResponse.data.secretId,
              secretkey: envConfigResponse.data.secretKey,
              engine_model_type: '16k_zh',
              voice_format: 1,
            };
            console.log('[UI] 使用环境变量配置');
          } else {
            throw new Error('无法获取有效配置');
          }
        } catch (envError) {
          console.error('[UI] 获取环境变量配置失败:', envError);
          setConnectionStatus('配置获取失败');
          return;
        }
      }

      console.log('[UI] 最终使用的配置:', {
        appid: config.appid,
        secretid: config.secretid ? '***' + config.secretid.slice(-4) : '未设置',
        secretkey: config.secretkey ? '***' + config.secretkey.slice(-4) : '未设置',
        engine_model_type: config.engine_model_type,
        voice_format: config.voice_format,
      });

      const manager = new VoiceRecognitionManager(config);
      
      // 设置回调函数
      manager.onRecognitionStart = (res) => {
        console.log('[UI] ✅ 识别开始:', res);
        setIsConnected(true);
        setConnectionStatus('已连接');
      };

      manager.onRecognitionResultChange = (res) => {
        console.log('[UI] 🔄 识别结果变化:', res);
        if (res.result && res.result.voice_text_str) {
          console.log('[UI] 📝 识别到文本:', res.result.voice_text_str);
          setRecognitionText(res.result.voice_text_str);
          // 更新问题显示
          setQuestion(res.result.voice_text_str);
        }
      };

      manager.onSentenceEnd = (res) => {
        console.log('[UI] ✅ 句子结束:', res);
        if (res.result && res.result.voice_text_str) {
          console.log('[UI] 📝 最终文本:', res.result.voice_text_str);
          const newText = res.result.voice_text_str + ' ';
          setFinalText(prev => prev + newText);
          setQuestion(prev => prev + newText);
          setRecognitionText('');
        }
      };

      manager.onRecognitionComplete = (res) => {
        console.log('[UI] 🏁 识别完成:', res);
        setIsRecording(false);
        setConnectionStatus('识别完成');
      };

      manager.onError = (error) => {
        console.error('[UI] ❌ 识别错误:', error);
        setIsConnected(false);
        setIsRecording(false);
        setConnectionStatus('连接错误: ' + (error.message || JSON.stringify(error)));
      };

      setVoiceManager(manager);
      console.log('[UI] ✅ 语音管理器初始化完成');
      setConnectionStatus('语音管理器已初始化');
      
    } catch (error) {
      console.error('[UI] ❌ 加载配置失败:', error);
      setConnectionStatus('配置加载失败: ' + (error instanceof Error ? error.message : String(error)));
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
    }
  };

  // 开始面试 - 替换为语音录音功能
  const handleStartRecording = async () => {
    if (!voiceManager) {
      console.error('[UI] 语音管理器未初始化');
      return;
    }

    try {
<<<<<<< HEAD
      setIsInterviewStarted(false);
      setVoiceState(prev => ({
        ...prev,
        isListening: false,
        status: '待机中...'
      }));

      // 调用语音服务停止录音
      if (window.electronAPI?.voice) {
        const result = await window.electronAPI.voice.stopRecording();
        if (result.success) {
          console.log('语音录制已停止');
        }
      }
=======
      console.log('[UI] 🎤 准备开始录音...');
      setConnectionStatus('正在连接...');
      
      // 检查麦克风权限
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[UI] ✅ 麦克风权限获取成功');
        stream.getTracks().forEach(track => track.stop()); // 释放临时流
      } catch (permError) {
        console.error('[UI] ❌ 麦克风权限获取失败:', permError);
        setConnectionStatus('麦克风权限获取失败');
        return;
      }
      
      console.log('[UI] 🔗 开始建立WebSocket连接...');
      await voiceManager.start();
      setIsRecording(true);
      setConnectionStatus('录音中...');
      console.log('[UI] ✅ 录音已开始');
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
    } catch (error) {
      console.error('[UI] ❌ 开始录音失败:', error);
      setConnectionStatus('录音失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 结束面试 - 替换为停止录音功能
  const handleStopRecording = () => {
    if (!voiceManager) {
      console.error('[UI] 语音管理器未初始化');
      return;
    }

    try {
      voiceManager.stop();
      setIsRecording(false);
      setConnectionStatus('录音已停止');
      console.log('[UI] 停止录音');
    } catch (error) {
      console.error('[UI] 停止录音失败:', error);
    }
  };

  // 切换监听状态
  const toggleListening = () => {
<<<<<<< HEAD
    if (isInterviewStarted) {
      stopInterview();
=======
    if (isRecording) {
      handleStopRecording();
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
    } else {
      handleStartRecording();
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
<<<<<<< HEAD
  };

  // 生成模拟回答
=======
    setRecognitionText('');
    setFinalText('');
  };

  // 初始化配置加载
  useEffect(() => {
    loadConfig();
  }, []);

  // 生成模拟回答（保留作为备用）
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
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

  // 模拟问题识别
  const simulateQuestionRecognition = () => {
    const mockQuestions = [
      '请介绍一下你自己',
      '你为什么想要这份工作？',
      '你的优势和劣势是什么？',
      '你对我们公司了解多少？',
      '你的职业规划是什么？'
    ];

    const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
    
    setQuestion('');
    let i = 0;
    const typeInterval = setInterval(() => {
      setQuestion(prev => prev + randomQuestion[i]);
      i++;
      
      if (i >= randomQuestion.length) {
        clearInterval(typeInterval);
        setTimeout(() => {
          generateMockAnswer(randomQuestion, currentMode);
        }, 500);
      }
    }, 100);
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

  // 初始化模拟 - 移除自动开始，等待用户点击开始面试按钮
  useEffect(() => {
    // 不再自动开始面试，等待用户手动点击
  }, []);

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
          <button className="title-btn" onClick={handleHide}>隐藏</button>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-left">
<<<<<<< HEAD
          <div className="mic-status">
            <span className="mic-icon">🎤</span>
            <span>{voiceState.status}</span>
            <div className={`recording-indicator ${voiceState.isListening ? 'active' : ''}`}></div>
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
=======
        <div className="mic-status">
          <span className="mic-icon">🎤</span>
          <span>{connectionStatus}</span>
          <div className={`recording-indicator ${isRecording ? 'active' : ''}`}></div>
        </div>
        
        <div className="volume-visualizer">
          {[0, 1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className={`volume-bar ${isRecording ? 'active' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
>>>>>>> 9d5cdfd (fix: 移除硬编码的敏感信息，使用环境变量替代)
        </div>
        
        <div className="status-right">
          <button 
            className={`interview-btn ${isInterviewStarted ? 'stop' : 'start'}`}
            onClick={toggleListening}
            disabled={!voiceManager}
          >
            {isInterviewStarted ? '结束面试' : '开始面试'}
          </button>
        </div>
      </div>

      {/* 问题区域 */}
      <div className="question-area">
        <div className="question-text">
          {question || <span className="question-placeholder">{questionPlaceholder}</span>}
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
    </div>
  );
};

export default MainInterface;