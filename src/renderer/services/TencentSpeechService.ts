// 导入类型定义
import type { ElectronAPI } from '../../shared/types/electron';

// 简单的日志工具
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args)
};

// 检查是否在 Electron 环境中
const isElectron = typeof window !== 'undefined' && window.electron;

export interface TencentSpeechConfig {
  secretId: string;
  secretKey: string;
  appId: string;
  region: string;
  engineType: string;
  voiceFormat: number;
  needVad: number;
  hotwordId: string;
  filterDirty: number;
  filterModal: number;
  filterPunc: number;
  convertNumMode: number;
  filterEmptyResult: number;
  vadSilenceTime: number;
}


export class TencentSpeechService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isListening = false;
  private audioBuffer: Int16Array = new Int16Array(0);
  private lastSendTime = 0;
  private startTime = 0; // 记录开始时间  
  private config: TencentSpeechConfig | null = null;
  private audioProcessTimer: NodeJS.Timeout | null = null; // 音频处理定时器
  private analyser: AnalyserNode | null = null; // 音频分析器

  // 腾讯云要求的音频参数
  private readonly TARGET_SAMPLE_RATE = 16000; // 16kHz
  private readonly SAMPLES_PER_CHUNK = 640; // 每40ms的样本数 (16000 * 0.04)
  private readonly BYTES_PER_CHUNK = 1280; // 640 * 2 bytes (16位)
  private readonly SEND_INTERVAL = 40; // 40ms发送间隔

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      logger.info('腾讯云语音识别服务初始化开始');
      
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持音频录制功能');
      }

      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('浏览器不支持Web Audio API');
      }

      logger.info('腾讯云语音识别服务初始化完成');
    } catch (error) {
      logger.error('腾讯云语音识别服务初始化失败:', error);
      throw error;
    }
  }

  // 公共初始化方法，供外部调用
  async initialize(config: TencentSpeechConfig): Promise<void> {
    try {
      this.config = config;
      logger.info('腾讯云语音识别配置已更新:', {
        appId: config.appId,
        region: config.region,
        engineType: config.engineType
      });
      
      // 执行基础初始化
      await this.initializeService();
      
      // 在 Electron 环境中，同时初始化主进程服务
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        try {
          const result = await window.electron.tencentSpeech.initialize(config);
          if (!result.success) {
            throw new Error(result.error || '主进程初始化失败');
          }
          logger.info('主进程腾讯云语音识别服务初始化成功');
        } catch (electronError) {
          logger.warn('主进程初始化失败，尝试使用浏览器版本:', electronError);
          // 不抛出错误，允许降级到浏览器版本
        }
      }
    } catch (error) {
      logger.error('初始化腾讯云语音识别失败:', error);
      throw error;
    }
  }

  // 更新配置方法
  async updateConfig(config: TencentSpeechConfig): Promise<void> {
    try {
      this.config = config;
      logger.info('腾讯云语音识别配置已更新');
      
      // 在 Electron 环境中，同时更新主进程配置
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        const result = await window.electron.tencentSpeech.initialize(config);
        if (!result.success) {
          throw new Error(result.error || '主进程配置更新失败');
        }
        logger.info('主进程腾讯云语音识别配置更新成功');
      }
    } catch (error) {
      logger.error('更新腾讯云语音识别配置失败:', error);
      throw error;
    }
  }

  async startListening(config: TencentSpeechConfig): Promise<void> {
    try {
      if (this.isListening) {
        logger.warn('语音识别已在进行中');
        return;
      }

      // 验证配置参数
      if (!config.secretId || !config.secretKey || !config.appId) {
        throw new Error('腾讯云配置参数不完整，请检查 SecretId、SecretKey 和 AppId');
      }

      this.config = config;
      logger.info('开始语音识别，配置:', {
        appId: config.appId,
        region: config.region,
        engineType: config.engineType,
        voiceFormat: config.voiceFormat
      });

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持音频录制功能，请使用现代浏览器');
      }

      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('浏览器不支持Web Audio API，请使用现代浏览器');
      }

      // 请求麦克风权限
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: this.TARGET_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        logger.info('麦克风权限获取成功');
      } catch (mediaError) {
        logger.error('获取麦克风权限失败:', mediaError);
        if (mediaError instanceof Error) {
          if (mediaError.name === 'NotAllowedError') {
            throw new Error('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
          } else if (mediaError.name === 'NotFoundError') {
            throw new Error('未找到可用的麦克风设备，请检查设备连接');
          } else if (mediaError.name === 'NotReadableError') {
            throw new Error('麦克风设备被其他应用占用，请关闭其他音频应用');
          }
        }
        throw new Error('无法访问麦克风设备: ' + (mediaError instanceof Error ? mediaError.message : '未知错误'));
      }

      // 创建音频上下文
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass({
          sampleRate: this.TARGET_SAMPLE_RATE
        });

        // 确保音频上下文处于运行状态
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        logger.info(`音频上下文创建成功，采样率: ${this.audioContext.sampleRate}Hz，状态: ${this.audioContext.state}`);
        console.log(`[音频调试] 请求采样率: ${this.TARGET_SAMPLE_RATE}Hz, 实际采样率: ${this.audioContext.sampleRate}Hz`);
      } catch (audioError) {
        logger.error('创建音频上下文失败:', audioError);
        throw new Error('音频系统初始化失败: ' + (audioError instanceof Error ? audioError.message : '未知错误'));
      }

      // 创建音频源节点
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 创建音频分析器节点（替代ScriptProcessorNode）
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0.3;

      // 连接音频节点
      this.sourceNode.connect(this.analyser);
      
      // 创建ScriptProcessorNode作为备用（但主要依赖定时器）
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      // 初始化音频缓冲区
      this.audioBuffer = new Int16Array(0);
      this.lastSendTime = Date.now();

      // 设置ScriptProcessorNode回调（备用）
      this.processorNode.onaudioprocess = (e) => {
        try {
          console.log('[渲染进程] ScriptProcessorNode回调被触发');
          this.processAudioData(e);
        } catch (processError) {
          logger.error('音频处理回调错误:', processError);
        }
      };
      
      // 临时禁用音频处理定时器以测试渲染进程稳定性
      // this.startAudioProcessTimer();
      
      logger.info('音频处理系统已设置（定时器已禁用用于测试）');

      this.isListening = true;
      this.startTime = Date.now(); // 记录开始时间

      // 首先测试 IPC 连接
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        try {
          // 测试基本IPC连接
          console.log('[渲染进程] 测试IPC连接...');
          const testResult = await (window.electron.tencentSpeech as any).test?.();
          console.log('[渲染进程] IPC测试结果:', testResult);
        } catch (testError) {
          console.log('[渲染进程] IPC测试失败:', testError);
        }
        
        try {
          const result = await window.electron.tencentSpeech.start();
          if (!result.success) {
            throw new Error(result.error || '启动语音识别失败');
          }
          logger.info('主进程语音识别启动成功');
        } catch (ipcError) {
          logger.error('主进程通信失败:', ipcError);
          // 先停止当前的音频处理
          await this.stopListening();
          throw new Error('与主进程通信失败，请重启应用后重试');
        }
      } else {
        logger.warn('Electron API 不可用，无法启动语音识别');
        // 在此情况下也要停止音频处理
        await this.stopListening();
        throw new Error('Electron环境不可用，请在桌面应用中使用此功能');
      }

    } catch (error) {
      logger.error('启动语音识别失败:', error);
      await this.stopListening();
      throw error;
    }
  }

  private processAudioData(e: AudioProcessingEvent) {
    console.log('[渲染进程] processAudioData被调用, isListening:', this.isListening);
    if (!this.isListening) {
      console.log('[渲染进程] 不在监听状态，跳过音频处理');
      return;
    }

    try {
      // 获取音频数据 (Float32Array)
      const inputData = e.inputBuffer.getChannelData(0);
      
      if (!inputData || inputData.length === 0) {
        logger.debug('收到空音频数据');
        return;
      }
      
      // 检查是否有音频输入（降低阈值，避免过度过滤）
      let hasAudio = false;
      let maxAmplitude = 0;
      for (let i = 0; i < inputData.length; i++) {
        const amplitude = Math.abs(inputData[i]);
        maxAmplitude = Math.max(maxAmplitude, amplitude);
        if (amplitude > 0.00001) { // 非常低的阈值，只过滤纯静默
          hasAudio = true;
        }
      }
      
      // **重要**: 为了避免4008错误（超过15秒未发送数据），必须持续发送数据
      // 即使是完全静默的数据也要发送，以保持与腾讯云的连接

      // 注释掉重复的音频检测代码，避免变量重复定义

      // 检查是否需要重采样
      const currentSampleRate = this.audioContext?.sampleRate || this.TARGET_SAMPLE_RATE;
      let processedData: Float32Array;

      console.log(`[音频调试] 当前采样率: ${currentSampleRate}Hz, 目标采样率: ${this.TARGET_SAMPLE_RATE}Hz, 原始样本数: ${inputData.length}`);

      if (currentSampleRate !== this.TARGET_SAMPLE_RATE) {
        // 需要重采样到16kHz
        processedData = this.resampleAudio(inputData, currentSampleRate, this.TARGET_SAMPLE_RATE);
        console.log(`[音频调试] 重采样完成: ${currentSampleRate}Hz -> ${this.TARGET_SAMPLE_RATE}Hz, 样本数: ${inputData.length} -> ${processedData.length}`);
        logger.debug(`重采样: ${currentSampleRate}Hz -> ${this.TARGET_SAMPLE_RATE}Hz, 样本数: ${inputData.length} -> ${processedData.length}`);
      } else {
        processedData = inputData;
        console.log(`[音频调试] 无需重采样，直接使用原始数据`);
      }

      // 转换为16位PCM格式
      const pcmData = this.convertToPCM16(processedData);
      console.log(`[音频调试] PCM转换完成: ${processedData.length}样本 -> ${pcmData.length}样本(int16), 字节数: ${pcmData.length * 2}`);

      // 添加到缓冲区
      const newBuffer = new Int16Array(this.audioBuffer.length + pcmData.length);
      newBuffer.set(this.audioBuffer);
      newBuffer.set(pcmData, this.audioBuffer.length);
      this.audioBuffer = newBuffer;

      // 记录音频状态
      if (hasAudio) {
        logger.debug(`处理音频数据: 长度=${inputData.length}, 最大振幅=${maxAmplitude.toFixed(4)}, 有效音频=${hasAudio}`);
      }

      // 发送音频数据块
      this.sendAudioChunks();

    } catch (error) {
      console.error('处理音频数据失败:', error);
      logger.error('处理音频数据失败:', error);
    }
  }

  private resampleAudio(inputData: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }

    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const inputIndexFloor = Math.floor(inputIndex);
      const inputIndexCeil = Math.min(inputIndexFloor + 1, inputData.length - 1);
      const fraction = inputIndex - inputIndexFloor;

      // 线性插值
      outputData[i] = inputData[inputIndexFloor] * (1 - fraction) + inputData[inputIndexCeil] * fraction;
    }

    return outputData;
  }

  private convertToPCM16(floatData: Float32Array): Int16Array {
    const pcmData = new Int16Array(floatData.length);
    let minSample = Infinity;
    let maxSample = -Infinity;
    let nonZeroCount = 0;
    
    for (let i = 0; i < floatData.length; i++) {
      // 限制范围到 [-1, 1]
      const sample = Math.max(-1, Math.min(1, floatData[i]));
      // 转换为16位整数
      const intSample = Math.round(sample * 32767);
      pcmData[i] = intSample;
      
      // 统计信息
      minSample = Math.min(minSample, intSample);
      maxSample = Math.max(maxSample, intSample);
      if (intSample !== 0) nonZeroCount++;
    }
    
    console.log(`[音频调试] PCM转换统计: 最小值=${minSample}, 最大值=${maxSample}, 非零样本=${nonZeroCount}/${floatData.length}`);
    
    return pcmData;
  }

  private sendAudioChunks() {
    const now = Date.now();
    
    // 控制发送频率 (40ms间隔)
    if (now - this.lastSendTime < this.SEND_INTERVAL) {
      return;
    }

    // 临时修改：总是发送测试正弦波来验证格式问题
    if ((now - this.lastSendTime) >= this.SEND_INTERVAL) {
      console.log(`[音频调试] 🧪 发送测试正弦波（跳过真实音频数据）`);
      this.sendTestSineWave();
    }
    
    // 注释掉真实音频处理，专注验证格式
    // if (this.audioBuffer.length >= this.SAMPLES_PER_CHUNK) {
    //   this.sendStandardChunk();
    // }
    
    // 注意：移除sendAvailableData()调用，避免发送不标准大小的数据包
  }
  
  private sendStandardChunk() {
    const chunk = this.audioBuffer.slice(0, this.SAMPLES_PER_CHUNK);
    this.audioBuffer = this.audioBuffer.slice(this.SAMPLES_PER_CHUNK);
    this.sendAudioChunk(chunk);
  }
  
  private sendSilencePacket() {
    // 创建640个样本的静音数据包（40ms，16kHz）
    const silenceChunk = new Int16Array(this.SAMPLES_PER_CHUNK);
    // silenceChunk 已经默认填充为0，表示静音
    this.sendAudioChunk(silenceChunk);
    logger.debug('发送静音数据包以保持连接');
  }
  
  private sendTestSineWave() {
    // 生成与独立测试完全相同的440Hz正弦波测试信号
    const testChunk = new Int16Array(this.SAMPLES_PER_CHUNK);
    const frequency = 440; // A4音符
    const amplitude = 0.3; // 30%音量避免过载
    
    for (let i = 0; i < this.SAMPLES_PER_CHUNK; i++) {
      const time = i / this.TARGET_SAMPLE_RATE;
      const sampleValue = Math.sin(2 * Math.PI * frequency * time) * amplitude;
      testChunk[i] = Math.round(sampleValue * 32767);
    }
    
    console.log(`[音频调试] 🎵 发送测试正弦波: 频率=${frequency}Hz, 样本数=${testChunk.length}`);
    console.log(`[音频调试] 🎵 样本值范围: min=${Math.min(...testChunk)}, max=${Math.max(...testChunk)}`);
    this.sendAudioChunk(testChunk);
    logger.debug('发送测试正弦波信号');
  }
  
  private sendAudioChunk(chunk: Int16Array) {
    if (chunk.length === 0) return;
    
    // 严格验证数据包大小：必须是640样本/1280字节
    if (chunk.length !== this.SAMPLES_PER_CHUNK) {
      console.error(`[音频错误] 数据包大小不正确: ${chunk.length}样本 (需要${this.SAMPLES_PER_CHUNK}样本)`);
      logger.error(`音频数据包大小错误: ${chunk.length}样本, 需要${this.SAMPLES_PER_CHUNK}样本`);
      return;
    }
    
    // 创建二进制数据 - 使用标准方法，确保字节序正确
    const audioData = new ArrayBuffer(chunk.length * 2);
    const uint8View = new Uint8Array(audioData);
    
    // 手动写入16位PCM数据（小端序，符合x86标准）
    for (let i = 0; i < chunk.length; i++) {
      const sample = Math.max(-32768, Math.min(32767, chunk[i]));
      const byteIndex = i * 2;
      // 小端序：低字节在前
      uint8View[byteIndex] = sample & 0xFF;           // 低字节
      uint8View[byteIndex + 1] = (sample >> 8) & 0xFF; // 高字节
    }
    
    console.log(`[音频调试] PCM数据创建: ${chunk.length}样本 -> ${audioData.byteLength}字节`);
    console.log(`[音频调试] 前10个字节:`, Array.from(uint8View.slice(0, 10)));
    console.log(`[音频调试] 前5个样本值:`, Array.from(chunk.slice(0, 5)));
    
    // 验证字节数
    if (audioData.byteLength !== this.BYTES_PER_CHUNK) {
      console.error(`[音频错误] 字节数不正确: ${audioData.byteLength}字节 (需要${this.BYTES_PER_CHUNK}字节)`);
      return;
    }
    
    logger.debug(`发送音频数据: ${audioData.byteLength} 字节, 样本数: ${chunk.length}`);
    console.log(`[音频调试] ✅ 发送标准音频块: ${chunk.length}样本, ${audioData.byteLength}字节`);
    
    // 发送到主进程 - 使用 Uint8Array 而不是 ArrayBuffer 以避免序列化问题
    if (isElectron && window.electron && window.electron.tencentSpeech) {
      console.log(`[渲染进程] 准备发送音频数据: ${audioData.byteLength} 字节`);
      
      try {
        // 转换为 Uint8Array 进行传输
        const uint8Array = new Uint8Array(audioData);
        console.log(`[渲染进程] 转换为Uint8Array: ${uint8Array.length} 字节`);
        
        window.electron.tencentSpeech.sendAudio(uint8Array).then(result => {
          if (result.success) {
            console.log(`[渲染进程] ✅ 音频数据发送成功: ${uint8Array.length} 字节`);
          } else {
            console.log(`[渲染进程] ❌ 音频数据发送失败:`, result.error);
            logger.error('发送音频数据失败:', result.error);
          }
        }).catch(error => {
          console.log(`[渲染进程] ❌ 音频数据发送异常:`, error);
          logger.error('发送音频数据异常:', error);
        });
      } catch (syncError) {
        console.log(`[渲染进程] ❌ 发送音频数据同步错误:`, syncError);
        logger.error('发送音频数据同步错误:', syncError);
      }
    } else {
      console.log(`[渲染进程] ❌ Electron API不可用`);
    }
    
    this.lastSendTime = Date.now();
  }

  async stopListening(): Promise<void> {
    try {
      logger.info('正在停止语音识别...');
      this.isListening = false;

      // 停止音频处理定时器
      this.stopAudioProcessTimer();

      // 停止音频处理节点
      if (this.processorNode) {
        try {
          this.processorNode.onaudioprocess = null;
          this.processorNode.disconnect();
          this.processorNode = null;
          logger.debug('音频处理节点已断开');
        } catch (error) {
          logger.warn('断开音频处理节点时出错:', error);
        }
      }

      // 停止音频分析器节点
      if (this.analyser) {
        try {
          this.analyser.disconnect();
          this.analyser = null;
          logger.debug('音频分析器节点已断开');
        } catch (error) {
          logger.warn('断开音频分析器节点时出错:', error);
        }
      }

      // 停止音频源节点
      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
          this.sourceNode = null;
          logger.debug('音频源节点已断开');
        } catch (error) {
          logger.warn('断开音频源节点时出错:', error);
        }
      }

      // 关闭音频上下文
      if (this.audioContext) {
        try {
          if (this.audioContext.state !== 'closed') {
            await this.audioContext.close();
            logger.debug('音频上下文已关闭');
          }
          this.audioContext = null;
        } catch (error) {
          logger.warn('关闭音频上下文时出错:', error);
          this.audioContext = null;
        }
      }

      // 停止媒体流
      if (this.mediaStream) {
        try {
          this.mediaStream.getTracks().forEach(track => {
            track.stop();
            logger.debug(`音频轨道已停止: ${track.kind}, 状态: ${track.readyState}`);
          });
          this.mediaStream = null;
          logger.debug('媒体流已停止');
        } catch (error) {
          logger.warn('停止媒体流时出错:', error);
          this.mediaStream = null;
        }
      }

      // 清理音频缓冲区
      this.audioBuffer = new Int16Array(0);
      this.lastSendTime = 0;

      // 通知主进程停止语音识别
      if (isElectron && window.electron && window.electron.tencentSpeech) {
        try {
          await window.electron.tencentSpeech.stop();
          logger.debug('主进程语音识别已停止');
        } catch (error) {
          logger.warn('停止主进程语音识别时出错:', error);
        }
      }

      logger.info('✅ 语音识别已完全停止');
    } catch (error) {
      logger.error('停止语音识别过程中出现错误:', error);
      // 即使出错也要确保状态重置
      this.isListening = false;
      this.processorNode = null;
      this.sourceNode = null;
      this.audioContext = null;
      this.mediaStream = null;
      this.audioBuffer = new Int16Array(0);
    }
  }

  isRecording(): boolean {
    return this.isListening;
  }

  // 获取音频设备列表
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      logger.error('获取音频设备失败:', error);
      return [];
    }
  }

  // 测试麦克风权限
  async testMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      logger.error('麦克风测试失败:', error);
      return false;
    }
  }
  
  /**
   * 启动音频处理定时器（替代ScriptProcessorNode）
   */
  private startAudioProcessTimer() {
    if (this.audioProcessTimer) {
      clearInterval(this.audioProcessTimer);
    }
    
    console.log('[渲染进程] 启动音频处理定时器');
    
    // 按照腾讯云要求的40ms间隔处理音频数据
    this.audioProcessTimer = setInterval(() => {
      if (!this.isListening || !this.analyser || !this.audioContext) {
        return;
      }
      
      try {
        this.processAudioDataFromAnalyser();
      } catch (error) {
        logger.error('定时器音频处理错误:', error);
      }
    }, 40); // 严格按照腾讯云要求：40ms间隔，保持1:1实时率
  }
  
  /**
   * 停止音频处理定时器
   */
  private stopAudioProcessTimer() {
    if (this.audioProcessTimer) {
      clearInterval(this.audioProcessTimer);
      this.audioProcessTimer = null;
      console.log('[渲染进程] 音频处理定时器已停止');
    }
  }
  
  /**
   * 从AnalyserNode处理音频数据
   */
  private processAudioDataFromAnalyser() {
    if (!this.analyser || !this.isListening) return;
    
    // 获取音频频域数据
    const freqBufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(freqBufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    // 检查是否有音频输入
    let hasAudio = false;
    let maxAmplitude = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = dataArray[i] / 255.0; // 归一化到0-1
      maxAmplitude = Math.max(maxAmplitude, amplitude);
      if (amplitude > 0.01) { // 检测音频输入
        hasAudio = true;
      }
    }
    
    // 减少日志输出频率，只在检测到音频或每10次输出一次
    if (hasAudio || (Date.now() - this.lastSendTime) > 2000) {
      console.log(`[渲染进程] 音频检测: hasAudio=${hasAudio}, maxAmplitude=${maxAmplitude.toFixed(3)}`);
    }
    
    // 获取真实的时域音频数据
    const timeBufferLength = this.analyser.fftSize;
    const timeDataArray = new Float32Array(timeBufferLength);
    this.analyser.getFloatTimeDomainData(timeDataArray);
    
    console.log(`[音频调试] 从AnalyserNode获取时域数据: ${timeDataArray.length}样本，fftSize: ${this.analyser.fftSize}`);
    
    // 调用原来的音频处理函数，包含正确的重采样逻辑
    this.processAudioData(timeDataArray);
  }
}

// 导出单例实例
export const tencentSpeechService = new TencentSpeechService();