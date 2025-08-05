# 智谱AI HTTP API调用开发指南（完整整理）

## 一、核心优势

- **跨平台兼容**：支持所有支持HTTP协议的编程语言和平台
- **标准协议**：基于RESTful设计，遵循HTTP标准，易于理解和使用
- **灵活集成**：可集成到任何现有应用程序和系统中
- **实时调用**：支持同步和异步调用，满足不同场景需求

## 二、获取API Key

1. 访问智谱AI开放平台
2. 注册并登录账户
3. 在API Keys管理页面创建API Key
4. 复制API Key供使用

## 三、API基础信息

### 请求地址

```
https://open.bigmodel.cn/api/paas/v4/
```

### 请求头要求

```
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

### 支持的鉴权方式

1. **API Key鉴权**（最简单方式）
   - 直接在请求头中携带API Key
   - 示例：`Authorization: Bearer YOUR_API_KEY`

```js
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "model": "glm-4.5",
    "messages": [
        {
            "role": "user",
            "content": "你好"
        }
    ]
}'
```

2. **JWT Token鉴权**
   - 通过JWT令牌进行鉴权（需提前生成令牌）

```js
import time
import jwt

def generate_token(apikey: str, exp_seconds: int):
    try:
        id, secret = apikey.split(".")
    except Exception as e:
        raise Exception("invalid apikey", e)

    payload = {
        "api_key": id,
        "exp": int(round(time.time() * 1000)) + exp_seconds * 1000,
        "timestamp": int(round(time.time() * 1000)),
    }

    return jwt.encode(
        payload,
        secret,
        algorithm="HS256",
        headers={"alg": "HS256", "sign_type": "SIGN"},
    )

# 使用生成的 token
token = generate_token("your-api-key", 3600)  # 1小时有效期
```

## 四、基础调用示例（curl）

### 1. 简单对话示例

```js
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "model": "glm-4.5",
    "messages": [
        {
            "role": "user",
            "content": "请介绍一下人工智能的发展历程"
        }
    ],
    "temperature": 0.6,
    "max_tokens": 1024
}'
```

### 2. 流式响应示例

```curl
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "model": "glm-4.5",
    "messages": [
        {
            "role": "user",
            "content": "写一首关于春天的诗"
        }
    ],
    "stream": true
}'
```

- 特点：通过Server-Sent Events（SSE）实时返回生成内容，适合聊天场景
- 结束标识：返回`data: [DONE]`消息

### 3. 多轮对话示例

```curl
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
    "model": "glm-4.5",
    "messages": [
        {
            "role": "system",
            "content": "你是一个专业的编程助手"
        },
        {
            "role": "user",
            "content": "什么是递归？"
        },
        {
            "role": "assistant",
            "content": "递归是一种编程技术，函数调用自身来解决问题..."
        },
        {
            "role": "user",
            "content": "能给我一个Python递归的例子吗？"
        }
    ]
}'
```

- 特点：通过`messages`数组维护完整对话上下文，按时间顺序排列
- 支持角色：`system`（系统设定）、`user`（用户输入）、`assistant`（AI回复）

## 五、常用编程语言示例

### 1. Python示例

```python
import requests
import json

def call_zhipu_api(messages, model="glm-4.5"):
    url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

    headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    }

    data = {
        "model": model,
        "messages": messages,
        "temperature": 0.6
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API调用失败: {response.status_code}, {response.text}")

# 使用示例
messages = [
    {"role": "user", "content": "你好，请介绍一下自己"}
]

result = call_zhipu_api(messages)
print(result['choices'][0]['message']['content'])
```

### 2. JavaScript示例

```javascript
const axios = require('axios');

async function callZhipuApi(messages, model = "glm-4.5") {
    const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

    const headers = {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    };

    const data = {
        model: model,
        messages: messages,
        temperature: 0.6
    };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        throw new Error(`API调用失败: ${error.response?.status}, ${JSON.stringify(error.response?.data)}`);
    }
}

// 使用示例
const messages = [
    { "role": "user", "content": "你好，请介绍一下自己" }
];

callZhipuApi(messages)
    .then(result => console.log(result.choices[0].message.content))
    .catch(error => console.error(error));
```

### 3. Java示例（简化版）

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import com.google.gson.JsonObject;

public class ZhipuApiClient {
    private static final String API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
    private static final String API_KEY = "YOUR_API_KEY";

    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        JsonObject message = new JsonObject();
        message.addProperty("role", "user");
        message.addProperty("content", "你好，请介绍一下自己");

        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", "glm-4.5");
        requestBody.add("messages", new com.google.gson.JsonArray().add(message));
        requestBody.addProperty("temperature", 0.6);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Authorization", "Bearer " + API_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenAccept(System.out::println)
                .join();
    }
}
```

## 六、错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 401 | 未授权 | 检查API Key是否正确 |
| 429 | 请求过于频繁 | 降低请求频率，实施重试机制 |
| 500 | 服务器内部错误 | 稍后重试，如持续出现请联系支持 |

## 七、实践建议

### 安全性

- 妥善保管API Key，不要在代码中硬编码
- 使用环境变量或配置文件存储敏感信息
- 定期轮换API Key

### 性能优化

- 实施连接池和会话复用
- 合理设置超时时间
- 使用异步请求处理高并发场景

### 错误处理

- 实施指数退避重试机制
- 记录详细的错误日志
- 设置合理的超时和重试次数

### 监控

- 监控API调用频率和成功率
- 跟踪响应时间和错误率
- 设置告警机制
