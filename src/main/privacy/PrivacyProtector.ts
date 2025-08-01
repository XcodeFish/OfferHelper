import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../shared/utils/Logger';
import { WindowManager } from '../window/WindowManager';

const execAsync = promisify(exec);

export interface ScreenSharingApp {
  name: string;
  processName: string;
  windowTitle?: string;
}

export class PrivacyProtector {
  private isMonitoring: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private windowManager: WindowManager;
  private autoHideEnabled: boolean = false; // 默认关闭自动隐藏

  private readonly SCREEN_SHARING_APPS: ScreenSharingApp[] = [
    { name: 'Zoom', processName: 'zoom' },
    { name: 'Microsoft Teams', processName: 'teams' },
    { name: 'Skype', processName: 'skype' },
    { name: 'Google Chrome', processName: 'chrome' },
    { name: 'Mozilla Firefox', processName: 'firefox' },
    { name: 'Tencent Meeting', processName: 'wemeet' },
    { name: 'DingTalk', processName: 'dingtalk' },
    { name: 'Feishu', processName: 'feishu' },
    { name: 'OBS Studio', processName: 'obs' },
    { name: 'TeamViewer', processName: 'teamviewer' }
  ];

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
    logger.info('PrivacyProtector initialized');
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      logger.warn('Privacy monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.checkInterval = setInterval(async () => {
      await this.checkScreenSharing();
    }, 2000); // 每2秒检查一次

    logger.info('Privacy monitoring started');
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Privacy monitoring stopped');
  }

  private async checkScreenSharing(): Promise<void> {
    try {
      const isSharing = await this.detectScreenSharing();

      if (isSharing) {
        logger.debug('Screen sharing process detected');
        
        // 只有在启用自动隐藏时才隐藏窗口
        if (this.autoHideEnabled && this.windowManager.isVisible()) {
          this.windowManager.hide();
          logger.warn('Screen sharing detected, hiding main window');
        }
      } else {
        // 可以选择在这里自动显示窗口，或者让用户手动控制
        // if (!this.windowManager.isVisible()) {
        //   this.windowManager.show();
        //   logger.info('Screen sharing stopped, showing main window');
        // }
      }
    } catch (error) {
      logger.error('Error checking screen sharing', error);
    }
  }

  private async detectScreenSharing(): Promise<boolean> {
    // 方法1: 检测进程
    const processDetection = await this.checkProcesses();

    // 方法2: 检测窗口标题（在支持的平台上）
    const windowDetection = await this.checkWindowTitles();

    return processDetection || windowDetection;
  }

  private async checkProcesses(): Promise<boolean> {
    try {
      let command: string;

      if (process.platform === 'win32') {
        command = 'tasklist /fo csv';
      } else if (process.platform === 'darwin') {
        command = 'ps aux';
      } else {
        command = 'ps aux';
      }

      const { stdout } = await execAsync(command);
      const processOutput = stdout.toLowerCase();

      // 检查是否有屏幕共享相关的进程在运行
      const foundProcess = this.SCREEN_SHARING_APPS.some(app => {
        const processName = app.processName.toLowerCase();
        return processOutput.includes(processName);
      });

      return foundProcess;
    } catch (error) {
      logger.error('Error checking processes', error);
      return false;
    }
  }

  private async checkWindowTitles(): Promise<boolean> {
    try {
      // 这里可以实现窗口标题检测
      // 由于跨平台复杂性，暂时返回false
      // 在实际实现中，可以使用平台特定的API来检测窗口标题

      const sharingKeywords = [
        '正在共享屏幕', '屏幕共享', 'screen sharing',
        'zoom meeting', 'teams meeting', 'skype call',
        '腾讯会议', '钉钉会议', '飞书会议'
      ];

      // 这里应该实现实际的窗口标题检测逻辑
      // 目前返回false作为占位符
      return false;
    } catch (error) {
      logger.error('Error checking window titles', error);
      return false;
    }
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public getDetectedApps(): ScreenSharingApp[] {
    return [...this.SCREEN_SHARING_APPS];
  }

  public addCustomApp(app: ScreenSharingApp): void {
    this.SCREEN_SHARING_APPS.push(app);
    logger.info('Added custom screen sharing app', app);
  }

  public removeCustomApp(processName: string): void {
    const index = this.SCREEN_SHARING_APPS.findIndex(app => app.processName === processName);
    if (index > -1) {
      const removed = this.SCREEN_SHARING_APPS.splice(index, 1);
      logger.info('Removed custom screen sharing app', removed[0]);
    }
  }

  public setAutoHideEnabled(enabled: boolean): void {
    this.autoHideEnabled = enabled;
    logger.info(`Auto-hide ${enabled ? 'enabled' : 'disabled'}`);
  }

  public isAutoHideEnabled(): boolean {
    return this.autoHideEnabled;
  }

  public destroy(): void {
    this.stopMonitoring();
    logger.info('PrivacyProtector destroyed');
  }
}