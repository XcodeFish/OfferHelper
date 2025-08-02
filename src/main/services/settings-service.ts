import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

interface AppSettings {
  // 语音设置
  voiceSettings: {
    inputDevice: string;
    outputDevice: string;
    volume: number;
    sensitivity: number;
    noiseReduction: boolean;
    autoStart: boolean;
  };
  // AI设置
  aiSettings: {
    responseMode: 'simple' | 'normal' | 'detailed';
    language: 'zh-CN' | 'en-US';
    temperature: number;
    maxTokens: number;
  };
  // 界面设置
  uiSettings: {
    theme: 'dark' | 'light' | 'auto';
    opacity: number;
    alwaysOnTop: boolean;
    startMinimized: boolean;
    showInTaskbar: boolean;
  };
  // 快捷键设置
  shortcuts: {
    toggleListening: string;
    hideWindow: string;
    clearContent: string;
    copyAnswer: string;
    switchMode: string;
  };
  // 账户设置
  account: {
    email: string;
    plan: 'free' | 'pro' | 'enterprise';
    usage: {
      requests: number;
      limit: number;
    };
  };
  [key: string]: any;
}

export class SettingsService {
  private settingsPath: string;
  private settings: AppSettings;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  private getDefaultSettings(): AppSettings {
    return {
      voiceSettings: {
        inputDevice: 'default',
        outputDevice: 'default',
        volume: 80,
        sensitivity: 70,
        noiseReduction: true,
        autoStart: false,
      },
      aiSettings: {
        responseMode: 'normal',
        language: 'zh-CN',
        temperature: 0.7,
        maxTokens: 1000,
      },
      uiSettings: {
        theme: 'dark',
        opacity: 90,
        alwaysOnTop: false,
        startMinimized: false,
        showInTaskbar: true,
      },
      shortcuts: {
        toggleListening: 'Cmd+Shift+S',
        hideWindow: 'Cmd+Shift+H',
        clearContent: 'Cmd+Shift+C',
        copyAnswer: 'Cmd+Shift+V',
        switchMode: 'Cmd+Shift+M',
      },
      account: {
        email: 'admin@example.com',
        plan: 'free',
        usage: {
          requests: 45,
          limit: 100,
        },
      },
    };
  }

  private async loadSettings(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const savedSettings = JSON.parse(data);
      // 深度合并设置，确保新增的字段有默认值
      this.settings = this.mergeSettings(this.getDefaultSettings(), savedSettings);
    } catch (error) {
      // 如果文件不存在或读取失败，使用默认设置并保存
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
    }
  }

  // 深度合并设置对象
  private mergeSettings(defaultSettings: AppSettings, savedSettings: any): AppSettings {
    const merged = { ...defaultSettings };
    
    if (savedSettings) {
      // 合并语音设置
      if (savedSettings.voiceSettings) {
        merged.voiceSettings = { ...defaultSettings.voiceSettings, ...savedSettings.voiceSettings };
      }
      
      // 合并AI设置
      if (savedSettings.aiSettings) {
        merged.aiSettings = { ...defaultSettings.aiSettings, ...savedSettings.aiSettings };
      }
      
      // 合并界面设置
      if (savedSettings.uiSettings) {
        merged.uiSettings = { ...defaultSettings.uiSettings, ...savedSettings.uiSettings };
      }
      
      // 合并快捷键设置
      if (savedSettings.shortcuts) {
        merged.shortcuts = { ...defaultSettings.shortcuts, ...savedSettings.shortcuts };
      }
      
      // 合并账户设置
      if (savedSettings.account) {
        merged.account = { ...defaultSettings.account, ...savedSettings.account };
        if (savedSettings.account.usage) {
          merged.account.usage = { ...defaultSettings.account.usage, ...savedSettings.account.usage };
        }
      }
    }
    
    return merged;
  }

  private async saveSettings(): Promise<void> {
    try {
      await fs.writeFile(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2)
      );
    } catch (error) {
      console.error('保存设置失败:', error);
      throw error;
    }
  }

  async get(key?: string): Promise<any> {
    if (key) {
      return this.settings[key];
    }
    return this.settings;
  }

  async set(key: string, value: any): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();
  }

  async reset(): Promise<void> {
    this.settings = this.getDefaultSettings();
    await this.saveSettings();
  }

  async export(): Promise<AppSettings> {
    return { ...this.settings };
  }

  async import(settings: Partial<AppSettings>): Promise<void> {
    this.settings = { ...this.getDefaultSettings(), ...settings };
    await this.saveSettings();
  }
}
