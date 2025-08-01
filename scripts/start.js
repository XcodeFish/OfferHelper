const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动 OfferHelper 桌面端应用...');

// 检查是否已构建
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');

if (!fs.existsSync(distPath)) {
  console.log('📦 首次运行，正在构建应用...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 构建完成，启动应用...');
      startElectron();
    } else {
      console.error('❌ 构建失败');
      process.exit(1);
    }
  });
} else {
  console.log('📱 启动应用...');
  startElectron();
}

function startElectron() {
  const electronProcess = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  electronProcess.on('close', (code) => {
    console.log(`应用已退出，退出码: ${code}`);
  });
}