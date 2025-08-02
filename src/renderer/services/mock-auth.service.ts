import {
  LoginCredentials,
  AuthResponse,
} from '../components/auth/login-form.types';

// Mock用户数据
const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    email: 'user@example.com',
  },
  {
    id: '3',
    username: 'test',
    password: 'test123',
    email: 'test@example.com',
  },
];

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockAuthService {
  /**
   * 模拟登录接口
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // 模拟网络延迟
    await delay(1000 + Math.random() * 1000);

    const { username, password } = credentials;

    // 输入验证
    if (!username || !password) {
      throw new Error('用户名和密码不能为空');
    }

    // 查找用户
    const user = MOCK_USERS.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      // 模拟不同的错误情况
      const random = Math.random();
      if (random < 0.3) {
        throw new Error('用户名不存在');
      } else if (random < 0.6) {
        throw new Error('密码错误');
      } else {
        throw new Error('登录失败，请稍后重试');
      }
    }

    // 生成模拟token
    const token = this.generateMockToken(user.id);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      message: '登录成功',
    };
  }

  /**
   * 模拟验证token
   */
  static async verifyToken(token: string): Promise<AuthResponse> {
    await delay(500);

    try {
      const payload = this.parseToken(token);
      const user = MOCK_USERS.find(u => u.id === payload.userId);

      if (!user) {
        throw new Error('用户不存在');
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        message: 'Token验证成功',
      };
    } catch (error) {
      throw new Error('Token无效或已过期');
    }
  }

  /**
   * 模拟登出
   */
  static async logout(): Promise<void> {
    await delay(300);
    // 清除本地存储的token
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  }

  /**
   * 模拟注册
   */
  static async register(userData: {
    username: string;
    password: string;
    email: string;
  }): Promise<AuthResponse> {
    await delay(1500);

    const { username, email } = userData;

    // 检查用户名是否已存在
    const existingUser = MOCK_USERS.find(u => u.username === username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = MOCK_USERS.find(u => u.email === email);
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    // 创建新用户
    const newUser = {
      id: String(MOCK_USERS.length + 1),
      username,
      password: userData.password,
      email,
    };

    MOCK_USERS.push(newUser);

    const token = this.generateMockToken(newUser.id);

    return {
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
      message: '注册成功',
    };
  }

  /**
   * 模拟发送验证码
   */
  static async sendVerificationCode(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    await delay(800);

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('请输入有效的邮箱地址');
    }

    // 模拟发送成功
    return {
      success: true,
      message: '验证码已发送到您的邮箱',
    };
  }

  /**
   * 模拟验证码验证
   */
  static async verifyCode(email: string, code: string): Promise<AuthResponse> {
    await delay(600);

    // 模拟验证码验证（简单的mock逻辑）
    const validCodes = ['123456', '888888', '000000'];

    if (!validCodes.includes(code)) {
      throw new Error('验证码错误');
    }

    // 查找或创建用户
    let user = MOCK_USERS.find(u => u.email === email);

    if (!user) {
      // 如果用户不存在，创建新用户
      user = {
        id: String(MOCK_USERS.length + 1),
        username: email.split('@')[0],
        password: 'temp123', // 临时密码
        email,
      };
      MOCK_USERS.push(user);
    }

    const token = this.generateMockToken(user.id);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      message: '验证成功',
    };
  }

  /**
   * 生成模拟token
   */
  private static generateMockToken(userId: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        userId,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
        iat: Date.now(),
      })
    );
    const signature = btoa(`mock_signature_${userId}_${Date.now()}`);

    return `${header}.${payload}.${signature}`;
  }

  /**
   * 解析模拟token
   */
  private static parseToken(token: string): {
    userId: string;
    exp: number;
    iat: number;
  } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp < Date.now()) {
      throw new Error('Token expired');
    }

    return payload;
  }

  /**
   * 获取当前用户信息
   */
  static getCurrentUser(): {
    id: string;
    username: string;
    email: string;
  } | null {
    const token = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');

    if (!token || !userInfo) {
      return null;
    }

    try {
      this.parseToken(token); // 验证token是否有效
      return JSON.parse(userInfo);
    } catch (error) {
      // Token无效，清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      return null;
    }
  }

  /**
   * 保存用户信息到本地存储
   */
  static saveUserInfo(
    token: string,
    user: { id: string; username: string; email: string }
  ): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
  }

  /**
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
}
