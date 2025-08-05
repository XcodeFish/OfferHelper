# 对话补全接口完整信息整理

## 一、接口基础信息

- **接口功能**：创建聊天对话补全，为给定的对话消息生成AI回复，支持多模态（文本、图片、音频、视频），可配置多种参数控制生成行为，支持流式和非流式输出模式。
- **请求方式**：POST
- **请求URL**：<https://open.bigmodel.cn/api/paas/v4/chat/completions>

## 二、请求头（Headers）

| 参数名 | 类型 | 说明 | 是否必填 |
| ---- | ---- | ---- | ---- |
| Authorization | string | 身份验证，格式为：Bearer <your api key> | 是 |
| Content-Type | string | 数据类型，固定值为application/json | 是 |

## 三、请求体（Body）参数详情

### 1. 核心必填参数

#### model

- **类型**：enum<string>
- **默认值**：glm-4.5
- **说明**：调用的模型代码，不同模型具备不同能力。
- **可选值**：
  - glm-4.5、glm-4.5-air、glm-4.5-x、glm-4.5-airx、glm-4.5-flash
  - glm-4-plus、glm-4-air-250414、glm-4-airx、glm-4-flashx、glm-4-flashx-250414
  - glm-z1-air、glm-z1-airx、glm-z1-flash、glm-z1-flashx
  - glm-4v-plus-0111（支持多图及视频理解，最多处理5张图像）、glm-4v-flash（免费，专注单一图像理解）
  - glm-4.1v-thinking-flashx、glm-4.1v-thinking-flash
- **示例**："glm-4.5"

#### messages

- **类型**：(用户消息·object | 系统消息·object | 助手消息·object | 工具消息·object)[]
- **说明**：对话消息列表，包含当前对话的完整上下文信息，按时间顺序排列。每条消息有特定角色和内容，模型据此生成回复。
- **角色类型**：
  - system（系统消息，用于设定AI的行为和角色）
  - user（用户消息，来自用户的输入）
  - assistant（助手消息，来自AI的回复）
  - tool（工具消息，工具调用的结果）
- **内容支持**：纯文本和多模态内容（文本、图片、音频、视频）
- **约束**：Minimum length为1

### 2. 可选参数

#### request_id

- **类型**：string
- **说明**：请求唯一标识符，由用户端传递，用于追踪和区分每个API请求，建议使用UUID格式确保唯一性。未提供时，平台将自动生成。

#### do_sample

- **类型**：boolean
- **默认值**：true
- **说明**：是否启用采样策略生成文本。
  - true：模型使用temperature、top_p等参数进行随机采样，输出更多样化。
  - false：模型使用贪心解码，总是选择概率最高的词汇，输出更具确定性，此时temperature和top_p参数被忽略。
- **适用场景**：需要一致性和可重复性的任务（如代码生成、翻译）建议设为false。
- **示例**：true

#### stream

- **类型**：boolean
- **默认值**：false
- **说明**：是否启用流式输出模式。
  - false：模型生成完整响应后一次性返回所有内容，适合短文本生成和批处理场景。
  - true：模型通过Server-Sent Events (SSE)流式返回生成的内容，用户可实时看到生成过程，适合聊天对话和长文本生成场景，结束时返回data: [DONE]消息。
- **示例**：false

#### thinking

- **类型**：object
- **说明**：控制大模型是否开启思维链，仅GLM-4.5及以上模型支持此参数配置。

#### temperature

- **类型**：number
- **默认值**：因模型而异（GLM-4.5系列默认0.6；GLM-4.1v系列默认0.8；GLM-Z1系列和GLM-4系列默认0.75）
- **取值范围**：[0.0, 1.0]
- **说明**：采样温度，控制输出的随机性和创造性。
  - 较高值（如0.8）：输出更随机、更具创造性，适合创意写作和头脑风暴。
  - 较低值（如0.2）：输出更稳定、更确定，适合事实性问答和代码生成。
- **建议**：根据应用场景调整top_p或temperature参数，不要同时调整两者。
- **示例**：0.6

#### top_p

- **类型**：number
- **默认值**：因模型而异（GLM-4.5系列默认0.95；GLM-4.1v系列默认0.6；GLM-Z1系列和GLM-4系列默认0.9）
- **取值范围**：[0.0, 1.0]
- **说明**：核采样（nucleus sampling）参数，是temperature采样的替代方法。模型只考虑累积概率达到top_p的候选词汇。
  - 较小值（如0.1）：只考虑前10%概率的词汇，输出更集中、更一致。
  - 较大值（如0.9）：考虑前90%概率的词汇，增加输出多样性。
- **建议**：根据应用场景调整top_p或temperature参数，不要同时调整两者。
- **示例**：0.95

#### max_tokens

- **类型**：integer
- **取值范围**：1 <= x <= 98304
- **说明**：模型输出的最大令牌（token）数量限制。
  - 不同模型支持最大长度不同：GLM-4.5最大支持96K，GLM-4.1v系列最大支持16K，GLM-Z1系列最大支持32K，建议设置不小于1024。
  - 令牌是文本基本单位，1个令牌约等于0.75个英文单词或1.5个中文字符。
  - 作用：控制响应长度和成本，避免过长输出。模型在达到限制前完成回答会自然结束，否则输出可能被截断。
- **示例**：1024

#### tools

- **类型**：Function Call · object[]
- **说明**：模型可以调用的工具列表，支持函数调用、知识库检索和网络搜索。使用此参数提供模型可生成JSON输入的函数列表或配置其他工具，最多支持128个函数。
- **模型支持情况**：GLM-4系列支持所有tools；GLM-4.5支持web search和retrieval；GLM-4v、GLM-4.1v-thinking系列不支持tools。

#### tool_choice

- **类型**：enum<string>
- **说明**：控制模型如何选择工具，仅在工具类型为function时补充。
- **可选值**：auto（默认值，且仅支持auto）

#### user_id

- **类型**：string
- **长度要求**：6-128个字符
- **说明**：终端用户的唯一标识符，建议使用不包含敏感信息的唯一标识。

#### stop

- **类型**：string[]
- **说明**：停止词列表，当模型生成的文本中遇到指定字符串时会立即停止生成，停止词不会包含在返回文本中。
- **约束**：目前仅支持单个停止词，格式为["stop_word1"]，Maximum length为1。
- **作用**：控制输出格式、防止模型生成不需要的内容，例如设置["Human:"]防止模型模拟用户发言。

#### response_format

- **类型**：object
- **说明**：指定模型的响应输出格式，默认为text。
- **支持格式**：
  - { "type": "text" }：普通文本输出模式，返回自然语言文本。
  - { "type": "json_object" }：JSON输出模式，返回有效的JSON格式数据，适用于结构化数据提取、API响应生成等场景，建议在提示词中明确说明需要JSON格式输出。

## 四、请求示例

```curl
curl --request POST \
  --url https://open.bigmodel.cn/api/paas/v4/chat/completions \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "model": "glm-4.5",
  "messages": [
    {
      "role": "user",
      "content": "What opportunities and challenges will the Chinese large model industry face in 2025?"
    }
  ]
}'
```

## 五、响应结果详情

### 响应状态码

- 200：业务处理成功

### 响应体结构（application/json）

| 字段名 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | string | 任务ID |
| request_id | string | 请求ID |
| created | integer | 请求创建时间，Unix时间戳（秒） |
| model | string | 模型名称 |
| choices | object[] | 模型响应列表，每个对象包含index（索引）、message（消息内容）、finish_reason（结束原因）等 |
| usage | object | 调用结束时返回的Token使用统计，包含prompt_tokens（提示词令牌数）、completion_tokens（生成令牌数）、prompt_tokens_details（提示词令牌详情，含cached_tokens）、total_tokens（总令牌数） |
| video_result | object[] | 视频生成结果，包含url（视频URL）、cover_image_url（封面图片URL）等 |
| web_search | object[] | 返回与网页搜索相关的信息，使用WebSearchToolSchema时返回，包含icon（图标）、title（标题）、link（链接）、media（媒体）、publish_date（发布日期）、content（内容）、refer（参考信息）等 |
| content_filter | object[] | 返回内容安全的相关信息，包含role（角色）、level（等级）等 |

### 响应示例

```json
{
  "id": "<string>",
  "request_id": "<string>",
  "created": 123,
  "model": "<string>",
  "choices": [
    {
      "index": 123,
      "message": {
        "role": "assistant",
        "content": "<string>",
        "reasoning_content": "<string>",
        "audio": {
          "id": "<string>",
          "data": "<string>",
          "expires_at": "<string>"
        },
        "tool_calls": [
          {
            "function": {
              "name": "<string>",
              "arguments": {}
            },
            "mcp": {
              "id": "<string>",
              "type": "mcp_list_tools",
              "server_label": "<string>",
              "error": "<string>",
              "tools": [
                {
                  "name": "<string>",
                  "description": "<string>",
                  "annotations": {},
                  "input_schema": {
                    "type": "object",
                    "properties": {},
                    "required": [
                      "<string>"
                    ],
                    "additionalProperties": true
                  }
                }
              ],
              "arguments": "<string>",
              "name": "<string>",
              "output": {}
            },
            "id": "<string>",
            "type": "<string>"
          }
        ]
      },
      "finish_reason": "<string>"
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 123,
    "prompt_tokens_details": {
      "cached_tokens": 123
    },
    "total_tokens": 123
  },
  "video_result": [
    {
      "url": "<string>",
      "cover_image_url": "<string>"
    }
  ],
  "web_search": [
    {
      "icon": "<string>",
      "title": "<string>",
      "link": "<string>",
      "media": "<string>",
      "publish_date": "<string>",
      "content": "<string>",
      "refer": "<string>"
    }
  ],
  "content_filter": [
    {
      "role": "<string>",
      "level": 123
    }
  ]
}
```

## 六、补充说明

- **令牌（token）**：文本的基本单位，1个令牌约等于0.75个英文单词或1.5个中文字符，用于计算API调用成本和控制输出长度。
- **多模态支持**：接口支持文本、图片、音频、视频等多模态内容的输入与处理，不同模型对多模态的支持能力存在差异。
- **工具调用限制**：不同模型对tools参数的支持情况不同，使用前需确认模型是否支持所需工具类型。
- **停止词使用**：stop参数用于精准控制输出终止时机，目前仅支持单个停止词，可有效避免模型生成无关内容。
