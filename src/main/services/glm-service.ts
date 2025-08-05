import jwt from 'jsonwebtoken';

export interface GLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
  audioSource?: 'voice' | 'text';
}

export interface GLMRequest {
  sessionId: string;
  userInput: string;
  context: GLMMessage[];
  options?: {
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface GLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTime: number;
}

// Node.js 18+ 内置fetch，无需导入

export class GLMService {
  private config: GLMConfig;
  private tokenCache: { token: string; expireTime: number } | null = null;

  constructor(config: GLMConfig) {
    this.config = config;
  }

  /**
   * 生成JWT Token - 智谱AI专用格式
   */
  private generateJWTToken(expireSeconds: number = 3600): string {
    try {
      const [id, secret] = this.config.apiKey.split('.');
      if (!id || !secret) {
        throw new Error('Invalid API key format');
      }

      // 智谱AI的JWT Token需要特定的header和payload格式
      const header = {
        alg: 'HS256',
        sign_type: 'SIGN',
      };

      const payload = {
        api_key: id,
        exp: Math.floor(Date.now() / 1000) + expireSeconds,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // 手动构建JWT Token
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
        'base64url'
      );
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
        'base64url'
      );

      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      const signature = require('crypto')
        .createHmac('sha256', secret)
        .update(signatureInput)
        .digest('base64url');

      const token = `${encodedHeader}.${encodedPayload}.${signature}`;

      console.log('JWT Token构建完成，长度:', token.length);
      return token;
    } catch (error) {
      console.error('JWT Token生成失败:', error);
      throw new Error(`JWT token generation failed: ${error}`);
    }
  }

  /**
   * 获取有效的JWT Token（带缓存）
   */
  private getValidToken(): string {
    const now = Date.now();

    // 如果缓存的token还有30分钟以上有效期，直接使用
    if (this.tokenCache && this.tokenCache.expireTime - now > 30 * 60 * 1000) {
      return this.tokenCache.token;
    }

    // 生成新token并缓存
    const token = this.generateJWTToken(3600); // 1小时有效期
    this.tokenCache = {
      token,
      expireTime: now + 3600 * 1000,
    };

    return token;
  }

  /**
   * 调用GLM API
   */
  public async callGLM(request: GLMRequest): Promise<GLMResponse> {
    const startTime = Date.now();

    try {
      const token = this.getValidToken();

      const requestBody = {
        model: this.config.model,
        messages: request.context,
        stream: request.options?.stream || false,
        temperature: request.options?.temperature || 0.3,
        max_tokens: request.options?.maxTokens || 500,
        top_p: 0.8,
        presence_penalty: 0.1,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Token失效，清除缓存并重试
          this.tokenCache = null;
          return this.callGLM(request);
        }
        throw new Error(
          `GLM API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as any;
      const responseTime = Date.now() - startTime;

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid GLM API response format');
      }

      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('GLM API调用失败:', error);

      if (error instanceof Error) {
        throw new Error(
          `GLM API调用失败: ${error.message} (响应时间: ${responseTime}ms)`
        );
      }
      throw new Error(
        `GLM API调用失败: 未知错误 (响应时间: ${responseTime}ms)`
      );
    }
  }

  /**
   * 流式调用GLM API
   */
  public async callGLMStream(
    request: GLMRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: GLMResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const token = this.getValidToken();

      const requestBody = {
        model: this.config.model,
        messages: request.context,
        stream: true,
        temperature: request.options?.temperature || 0.3,
        max_tokens: request.options?.maxTokens || 500,
        top_p: 0.8,
        presence_penalty: 0.1,
      };

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token失效，清除缓存并重试
          this.tokenCache = null;
          return this.callGLMStream(request, onChunk, onComplete, onError);
        }
        throw new Error(
          `GLM API error: ${response.status} ${response.statusText}`
        );
      }

      const reader = (response.body as any)?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              const responseTime = Date.now() - startTime;
              onComplete({
                content: fullContent,
                usage,
                responseTime,
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (
                parsed.choices &&
                parsed.choices[0] &&
                parsed.choices[0].delta
              ) {
                const content = parsed.choices[0].delta.content || '';
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              }

              if (parsed.usage) {
                usage = {
                  promptTokens: parsed.usage.prompt_tokens || 0,
                  completionTokens: parsed.usage.completion_tokens || 0,
                  totalTokens: parsed.usage.total_tokens || 0,
                };
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理下一行
            }
          }
        }
      }
    } catch (error) {
      console.error('GLM流式API调用失败:', error);
      onError(error instanceof Error ? error : new Error('未知错误'));
    }
  }

  /**
   * 测试GLM连接
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    model?: string;
  }> {
    console.log('开始GLM连接测试...');
    const startTime = Date.now();

    try {
      console.log('生成JWT Token...');
      const token = this.getValidToken();
      console.log('JWT Token生成成功');

      const testRequest = {
        model: this.config.model,
        messages: [
          {
            role: 'user' as const,
            content: '你好，请简单回复一下测试连接',
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      };

      console.log('发送API请求到:', this.config.baseUrl);
      console.log('使用模型:', this.config.model);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('请求超时，取消请求');
        controller.abort();
      }, 15000); // 增加到15秒超时

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      console.log(`API响应时间: ${responseTime}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          'API响应错误:',
          response.status,
          response.statusText,
          errorText
        );
        return {
          success: false,
          message: `连接失败: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      console.log('解析响应数据...');
      const data = (await response.json()) as any;
      console.log('响应数据:', JSON.stringify(data, null, 2));

      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log('GLM连接测试成功!');
        return {
          success: true,
          message: `连接成功 (响应时间: ${responseTime}ms)`,
          model: this.config.model,
        };
      } else {
        console.error('响应格式异常:', data);
        return {
          success: false,
          message: '响应格式异常',
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('GLM连接测试失败:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: `连接超时 (${responseTime}ms) - 请检查网络连接`,
          };
        }
        return {
          success: false,
          message: `连接失败: ${error.message} (${responseTime}ms)`,
        };
      }

      return {
        success: false,
        message: `未知错误 (${responseTime}ms)`,
      };
    }
  }

  /**
   * 清除token缓存
   */
  public clearTokenCache(): void {
    this.tokenCache = null;
  }
}
