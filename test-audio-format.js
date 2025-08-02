// 测试腾讯云音频格式的脚本
// 生成标准的16kHz 16bit PCM正弦波信号

function generateTestPCM() {
  const sampleRate = 16000; // 16kHz
  const duration = 1; // 1秒
  const frequency = 440; // A4音符，440Hz
  const totalSamples = sampleRate * duration;
  
  // 创建ArrayBuffer用于存储PCM数据
  const buffer = new ArrayBuffer(totalSamples * 2); // 16bit = 2字节
  const view = new DataView(buffer);
  
  // 生成正弦波
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * frequency * time);
    const sample = Math.round(amplitude * 32767); // 转换为16位整数
    
    // 写入PCM数据（小端序）
    view.setInt16(i * 2, sample, true);
  }
  
  console.log(`生成测试PCM数据:`);
  console.log(`- 采样率: ${sampleRate}Hz`);
  console.log(`- 时长: ${duration}秒`);
  console.log(`- 频率: ${frequency}Hz`);
  console.log(`- 总样本数: ${totalSamples}`);
  console.log(`- 总字节数: ${buffer.byteLength}`);
  console.log(`- 前几个样本值:`, Array.from({length: 10}, (_, i) => view.getInt16(i * 2, true)));
  
  return new Uint8Array(buffer);
}

// 验证40ms数据包大小
function validate40msPacket() {
  const sampleRate = 16000;
  const duration = 0.04; // 40ms
  const samplesPerPacket = sampleRate * duration; // 640样本
  const bytesPerPacket = samplesPerPacket * 2; // 1280字节
  
  console.log(`\n40ms数据包验证:`);
  console.log(`- 40ms对应样本数: ${samplesPerPacket}`);
  console.log(`- 40ms对应字节数: ${bytesPerPacket}`);
  console.log(`- 是否符合腾讯云要求: ${bytesPerPacket === 1280 ? '✅' : '❌'}`);
}

// 生成测试数据
const testData = generateTestPCM();
validate40msPacket();

console.log(`\n测试数据已生成，可用于腾讯云语音识别测试`);