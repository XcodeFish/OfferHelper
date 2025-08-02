import React, { useState } from 'react';
import './login-page.css';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('请填写完整的登录信息');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 模拟登录延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 简单的mock验证
      if (email === 'admin@example.com' && password === '123456') {
        onLogin(email);
      } else {
        throw new Error('邮箱或密码错误，请重试');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="app-icon">🎤</div>
        <h1 className="app-title">AI语音助手</h1>
        <p className="app-subtitle">智能面试助手，助您面试无忧</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">邮箱地址</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="请输入您的邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="请输入您的密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>

          {error && (
            <div className="error-message">{error}</div>
          )}
        </form>

        <div className="login-tips">
          <p>测试账户：admin@example.com</p>
          <p>测试密码：123456</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;