const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 清理构建目录
const cleanBuildDir = () => {
  console.log('🧹 清理构建目录...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });
};

// 构建主进程
const buildMain = () => {
  return new Promise((resolve, reject) => {
    console.log('🔧 构建主进程...');
    const process = spawn('npx', ['webpack', '--config', 'config/webpack.main.config.js', '--mode', 'production'], {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 主进程构建完成');
        resolve();
      } else {
        reject(new Error(`主进程构建失败，退出码: ${code}`));
      }
    });
  });
};

// 构建渲染进程
const buildRenderer = () => {
  return new Promise((resolve, reject) => {
    console.log('🎨 构建渲染进程...');
    const process = spawn('npx', ['webpack', '--config', 'config/webpack.renderer.config.js', '--mode', 'production'], {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 渲染进程构建完成');
        resolve();
      } else {
        reject(new Error(`渲染进程构建失败，退出码: ${code}`));
      }
    });
  });
};

// 复制资源文件
const copyResources = () => {
  console.log('📁 复制资源文件...');
  
  // 复制 package.json
  if (fs.existsSync('package.json')) {
    fs.copyFileSync('package.json', 'dist/package.json');
  }
  
  console.log('✅ 资源文件复制完成');
};

// 主构建函数
const main = async () => {
  try {
    console.log('🚀 开始构建 OfferHelper...');
    
    cleanBuildDir();
    
    // 并行构建主进程和渲染进程
    await Promise.all([
      buildMain(),
      buildRenderer()
    ]);
    
    copyResources();
    
    console.log('🎉 构建完成！');
    console.log('📦 可以运行 npm run dist 进行打包');
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
};

main();