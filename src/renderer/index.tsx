import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// 获取根元素
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// 创建React根实例
const root = createRoot(container);

// 渲染应用
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 热重载支持
// 热重载支持 (仅在开发环境且支持时启用)
if (process.env.NODE_ENV === 'development' && typeof module !== 'undefined' && (module as any).hot) {
  (module as any).hot.accept();
}

// 开发环境下的调试信息
if (process.env.NODE_ENV === 'development') {
  console.log('OfferHelper 渲染进程已启动');
}