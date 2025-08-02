const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 启动AI语音助手开发环境...');

// 检查必要文件
console.log('\n📋 检查项目文件...');
const requiredFiles = ['src/main/index.ts', 'package.json', 'tsconfig.json'];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ 缺少文件: ${file}`);
    process.exit(1);
  }
}

// 检查依赖
console.log('\n📦 检查依赖安装...');
if (fs.existsSync('node_modules')) {
  console.log('✅ 依赖已安装');
} else {
  console.log('📦 安装依赖...');
  const installResult = spawnSync('npm', ['install'], {
    stdio: 'inherit',
    shell: true,
  });

  if (installResult.status !== 0) {
    console.error('❌ 依赖安装失败');
    process.exit(1);
  }
}

console.log('\n🔧 启动开发模式...');

try {
  // 编译主进程
  console.log('🔨 编译主进程...');
  const tscResult = spawnSync('npx', ['tsc'], {
    stdio: 'inherit',
    shell: true,
  });

  if (tscResult.status !== 0) {
    console.error('❌ 主进程编译失败');
    process.exit(1);
  }

  console.log('✅ 主进程编译完成');

  // 构建渲染进程
  console.log('🔨 构建渲染进程...');
  const webpackResult = spawnSync(
    'npx',
    [
      'webpack',
      '--config',
      'webpack.renderer.config.js',
      '--mode',
      'development',
    ],
    {
      stdio: 'inherit',
      shell: true,
    }
  );

  if (webpackResult.status !== 0) {
    console.error('❌ 渲染进程构建失败');
    process.exit(1);
  }

  console.log('✅ 渲染进程构建完成');

  // 启动Electron应用
  console.log('🚀 启动Electron应用...');
  console.log('✅ 开发环境启动成功！');
  console.log('💡 按 Ctrl+C 停止开发服务器');

  const electronProcess = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
  });

  electronProcess.on('close', code => {
    console.log(`\n📱 应用已关闭 (退出码: ${code})`);
    process.exit(code);
  });

  electronProcess.on('error', error => {
    console.error('❌ Electron启动失败:', error);
    process.exit(1);
  });

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    electronProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    electronProcess.kill();
    process.exit(0);
  });
} catch (error) {
  console.error('❌ 启动失败:', error);
  process.exit(1);
}
