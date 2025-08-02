const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始构建项目...');

try {
  // 清理构建目录
  if (fs.existsSync('build')) {
    fs.rmSync('build', { recursive: true, force: true });
  }
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  console.log('清理完成');

  // 创建构建目录
  fs.mkdirSync('build', { recursive: true });
  fs.mkdirSync('build/main', { recursive: true });
  fs.mkdirSync('build/renderer', { recursive: true });
  fs.mkdirSync('build/preload', { recursive: true });

  console.log('构建目录创建完成');

  // 编译TypeScript
  console.log('编译TypeScript...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });

  console.log('TypeScript编译检查完成');

  // 使用webpack构建
  console.log('使用Webpack构建...');

  // 构建主进程
  if (fs.existsSync('webpack.main.config.js')) {
    execSync('npx webpack --config webpack.main.config.js --mode production', {
      stdio: 'inherit',
    });
  }

  // 构建渲染进程
  if (fs.existsSync('webpack.renderer.config.js')) {
    execSync(
      'npx webpack --config webpack.renderer.config.js --mode production',
      { stdio: 'inherit' }
    );
  }

  console.log('构建完成！');
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}
