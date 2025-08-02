// 主题管理器
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: 'light' | 'dark' | 'auto' = 'dark';
  private listeners: ((theme: string) => void)[] = [];

  private constructor() {
    this.initTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // 初始化主题
  private async initTheme() {
    try {
      if (window.electronAPI?.theme) {
        const result = await window.electronAPI.theme.get();
        if (result.success && result.theme) {
          this.currentTheme = result.theme as 'light' | 'dark' | 'auto';
        }
      }
    } catch (error) {
      console.error('初始化主题失败:', error);
    }

    this.applyTheme();
    this.setupThemeListener();
  }

  // 设置主题监听器
  private setupThemeListener() {
    if (window.electronAPI?.theme) {
      window.electronAPI.theme.onChanged((theme: string) => {
        this.currentTheme = theme as 'light' | 'dark' | 'auto';
        this.applyTheme();
        this.notifyListeners(theme);
      });
    }
  }

  // 应用主题
  private async applyTheme() {
    const effectiveTheme = await this.getEffectiveTheme();
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // 更新CSS变量
    this.updateCSSVariables(effectiveTheme);
  }

  // 获取有效主题（处理auto模式）
  private async getEffectiveTheme(): Promise<'light' | 'dark'> {
    if (this.currentTheme === 'auto') {
      try {
        if (window.electronAPI?.theme) {
          const result = await window.electronAPI.theme.getSystemTheme();
          if (result.success && result.theme) {
            return result.theme as 'light' | 'dark';
          }
        }
      } catch (error) {
        console.error('获取系统主题失败:', error);
      }
      return 'dark'; // 默认暗色主题
    }
    return this.currentTheme;
  }

  // 更新CSS变量
  private updateCSSVariables(theme: 'light' | 'dark') {
    const root = document.documentElement;

    console.log('正在应用主题:', theme); // 调试日志

    if (theme === 'light') {
      // 浅色主题变量 - 专业的浅色配色方案
      root.style.setProperty('--primary-bg', '#f5f5f7');        // 苹果风格的浅灰背景
      root.style.setProperty('--secondary-bg', '#ffffff');       // 纯白色卡片背景
      root.style.setProperty('--text-primary', '#1d1d1f');       // 深灰色主文字
      root.style.setProperty('--text-secondary', '#86868b');     // 中灰色次要文字
      root.style.setProperty('--border-color', '#d2d2d7');       // 浅灰色边框
      root.style.setProperty('--accent-color', '#007aff');       // iOS蓝色强调色
      root.style.setProperty('--success-color', '#34c759');      // iOS绿色
      root.style.setProperty('--warning-color', '#ff9500');      // iOS橙色
      root.style.setProperty('--error-color', '#ff3b30');        // iOS红色
      root.style.setProperty('--listening-color', '#007aff');    // 与强调色一致

      // 强制更新body背景色
      document.body.style.backgroundColor = '#f5f5f7';
      document.body.style.color = '#1d1d1f';
    } else {
      // 暗色主题变量 - 保持原有的专业暗色配色
      root.style.setProperty('--primary-bg', '#1a1a1a');
      root.style.setProperty('--secondary-bg', '#2d2d2d');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b3b3b3');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--accent-color', '#007acc');
      root.style.setProperty('--success-color', '#52c41a');
      root.style.setProperty('--warning-color', '#faad14');
      root.style.setProperty('--error-color', '#ff4d4f');
      root.style.setProperty('--listening-color', '#1890ff');

      // 强制更新body背景色
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    }

    // 触发重绘
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);

    // 强制重新渲染所有元素
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.display = 'none';
      element.offsetHeight; // 触发重排
      element.style.display = '';
    });
  }

  // 设置主题
  public async setTheme(theme: 'light' | 'dark' | 'auto') {
    try {
      if (window.electronAPI?.theme) {
        const result = await window.electronAPI.theme.set(theme);
        if (result.success) {
          this.currentTheme = theme;
          this.applyTheme();
          this.notifyListeners(theme);
        }
      }
    } catch (error) {
      console.error('设置主题失败:', error);
    }
  }

  // 获取当前主题
  public getCurrentTheme(): 'light' | 'dark' | 'auto' {
    return this.currentTheme;
  }

  // 添加主题变化监听器
  public addListener(listener: (theme: string) => void) {
    this.listeners.push(listener);
  }

  // 移除主题变化监听器
  public removeListener(listener: (theme: string) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners(theme: string) {
    this.listeners.forEach(listener => listener(theme));
  }

  // 切换主题
  public async toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    await this.setTheme(newTheme);
  }
}

// 导出单例实例
export const themeManager = ThemeManager.getInstance();
