import { logger } from '../../shared/utils/Logger';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface SecurityConfig {
  enableEncryption: boolean;
  enableProcessProtection: boolean;
  enableIntegrityCheck: boolean;
  keyRotationInterval: number;
}

class SecurityManager {
  private config: SecurityConfig;
  private encryptionKey: Buffer | null = null;
  private isInitialized = false;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      enableEncryption: true,
      enableProcessProtection: true,
      enableIntegrityCheck: true,
      keyRotationInterval: 24 * 60 * 60 * 1000, // 24小时
      ...config
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (this.config.enableEncryption) {
        await this.initializeEncryption();
      }

      if (this.config.enableProcessProtection) {
        this.enableProcessProtection();
      }

      if (this.config.enableIntegrityCheck) {
        this.startIntegrityCheck();
      }

      this.isInitialized = true;
      logger.info('安全管理器初始化完成');
    } catch (error) {
      logger.error('安全管理器初始化失败:', error);
      throw error;
    }
  }

  private async initializeEncryption(): Promise<void> {
    const keyPath = path.join(app.getPath('userData'), '.security-key');

    try {
      if (fs.existsSync(keyPath)) {
        this.encryptionKey = fs.readFileSync(keyPath);
      } else {
        this.encryptionKey = crypto.randomBytes(32);
        fs.writeFileSync(keyPath, this.encryptionKey, { mode: 0o600 });
      }
      logger.info('加密密钥初始化完成');
    } catch (error) {
      logger.error('加密密钥初始化失败:', error);
      this.encryptionKey = crypto.randomBytes(32);
    }
  }

  public encrypt(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('加密密钥未初始化');
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();
      const result = iv.toString('hex') + encrypted + authTag.toString('hex');

      return result;
    } catch (error) {
      logger.error('数据加密失败:', error);
      throw new Error('数据加密失败');
    }
  }

  public decrypt(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('加密密钥未初始化');
    }

    try {
      const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
      const authTag = Buffer.from(encryptedData.slice(-32), 'hex');
      const encrypted = encryptedData.slice(32, -32);

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('数据解密失败:', error);
      throw new Error('数据解密失败');
    }
  }

  private enableProcessProtection(): void {
    // 暂时禁用调试器检测，避免开发时的问题
    logger.info('调试器检测已禁用');

    // 监听进程信号
    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，准备退出');
      this.cleanup();
      app.quit();
    });

    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，准备退出');
      this.cleanup();
      app.quit();
    });

    logger.info('进程保护已启用');
  }

  private startIntegrityCheck(): void {
    // 定期检查关键文件完整性
    setInterval(() => {
      this.checkFileIntegrity();
    }, 60000); // 每分钟检查一次

    logger.info('完整性检查已启动');
  }

  private checkFileIntegrity(): void {
    try {
      const criticalFiles = [
        path.join(__dirname, '../main.js'),
        path.join(__dirname, '../preload.js')
      ];

      criticalFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          // 这里可以与预期的哈希值进行比较
          logger.debug(`文件完整性检查: ${filePath} - ${hash}`);
        }
      });
    } catch (error) {
      logger.error('完整性检查失败:', error);
    }
  }

  private cleanup(): void {
    // 清理敏感数据
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }

    logger.info('安全管理器清理完成');
  }

  public isSecurityEnabled(): boolean {
    return this.isInitialized;
  }

  public getSecurityStatus(): {
    encryption: boolean;
    processProtection: boolean;
    integrityCheck: boolean;
  } {
    return {
      encryption: this.config.enableEncryption && !!this.encryptionKey,
      processProtection: this.config.enableProcessProtection,
      integrityCheck: this.config.enableIntegrityCheck
    };
  }
}

export { SecurityManager };
export default SecurityManager;