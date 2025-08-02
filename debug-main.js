// 直接测试主进程启动
const { app, BrowserWindow } = require('electron');

console.log('🚀 DEBUG: 主进程开始启动');
console.error('🚀 DEBUG-ERROR: 主进程开始启动');

app.whenReady().then(() => {
  console.log('✅ DEBUG: 主进程已准备就绪');
  console.error('✅ DEBUG-ERROR: 主进程已准备就绪');
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  win.loadURL('data:text/html,<h1>Debug Test</h1>');
  console.log('🎯 DEBUG: 窗口已创建');
  console.error('🎯 DEBUG-ERROR: 窗口已创建');
});

app.on('window-all-closed', () => {
  console.log('🔚 DEBUG: 所有窗口已关闭');
  app.quit();
});