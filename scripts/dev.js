const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 确保必要的目录存在
const ensureDirectories = () => {
  const dirs = ['dist', 'logs', 'data'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// 启动主进程构建
const startMainBuild = () => {
  console.log('🔧 启动主进程构建...');
  const mainProcess = spawn('npx', ['webpack', '--config', 'config/webpack.main.config.js', '--mode', 'development', '--watch'], {
    stdio: 'inherit',
    shell: true
  });

  mainProcess.on('error', (error) => {
    console.error('主进程构建失败:', error);
  });

  return mainProcess;
};

// 启动渲染进程开发服务器
const startRendererDev = () => {
  console.log('🎨 启动渲染进程开发服务器...');
  const rendererProcess = spawn('npx', ['webpack', 'serve', '--config', 'config/webpack.renderer.config.js', '--mode', 'development'], {
    stdio: 'inherit',
    shell: true
  });

  rendererProcess.on('error', (error) => {
    console.error('渲染进程开发服务器启动失败:', error);
  });

  return rendererProcess;
};

// 启动 Electron
const startElectron = () => {
  console.log('⚡ 启动 Electron...');
  
  // 等待主进程构建完成
  const checkMainBuild = () => {
    if (fs.existsSync('dist/main.js')) {
      const electronProcess = spawn('npx', ['electron', 'dist/main.js'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' }
      });

      electronProcess.on('error', (error) => {
        console.error('Electron 启动失败:', error);
      });

      electronProcess.on('close', (code) => {
        console.log(`Electron 进程退出，退出码: ${code}`);
        process.exit(code);
      });

      return electronProcess;
    } else {
      setTimeout(checkMainBuild, 1000);
    }
  };

  setTimeout(checkMainBuild, 3000);
};

// 主函数
const main = () => {
  console.log('🚀 启动 OfferHelper 开发环境...');
  
  ensureDirectories();
  
  const mainProcess = startMainBuild();
  const rendererProcess = startRendererDev();
  
  // 等待渲染进程服务器启动
  setTimeout(startElectron, 5000);

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发环境...');
    mainProcess.kill();
    rendererProcess.kill();
    process.exit(0);
  });
};

main();