# 第 9 章 接口与数据契约（API/Schema）

> 本章在 MVP 范围内定义前后端、服务与第三方之间的接口与数据契约，覆盖鉴权、版本、限流与错误模型，以及“查词/再生成、历史、导出、用户画像、订阅/配额、配置发现、支付回调”和 Doubao 适配层的内部契约。所有 JSON 字段使用驼峰命名；不兼容变更采用版本演进与弃用期管理。本文与第 1–8 章口径一致，如有冲突，以“订阅矩阵与术语表”的单一事实源为准。 

------

## 9.1 基线规范

- **基地址**：`/api/v1`（内外统一），仅 HTTPS。
- **内容类型**：`Content-Type: application/json; charset=utf-8`
   内容协商：`Accept: application/vnd.glancy.dict.v1+json`。
- **鉴权**：`Authorization: Bearer <token>`（用户态 JWT）；Webhook 采用 HMAC 签名。
- **幂等**：写操作支持 `Idempotency-Key`（推荐值为 `hash(userId+entry+config)`）。参见“术语表-幂等”。 
- **跟踪**：请求头可携带 `X-Trace-Id`；响应统一回传同名头。
- **限流与配额回传**：
  - `X-RateLimit-Limit / Remaining / Reset`
  - `X-Quota-Type: lookup|regenerate`，`X-Quota-Remaining: <int>`
- **时间**：服务器存 UTC，客户端本地渲染；导出链接 TTL 10 分钟。 
- **分页**：列表接口使用游标分页：`?limit=50&cursor=<token>`；响应返回 `nextCursor`。
- **错误模型**：HTTP 状态码 + 统一错误体（见 9.11）。

------

## 9.2 契约版本与弃用

- 合同名：`glancy.dict.v1`（语义化版本）。不兼容升级发布 `v2` 并在旧版响应附加 `Sunset` 头与弃用日期。 

------

## 9.3 领域对象概览（JSON Schema 摘要）

> 以下为核心结构骨架（简化）。完整 JSON Schema 见各接口小节。

### 9.3.1 DictResult（查词结果骨架）

```json
{
  "contract": "glancy.dict.v1",
  "lookupId": "lk_123",
  "entry": "bank account",
  "langPair": { "source": "en", "target": "zh" },
  "sameLang": false,
  "modules": {
    "definitions": [
      {
        "senseId": "s_1",
        "pos": "n",
        "gloss": "a record of money held by a bank for a customer",
        "translation": "银行账户",
        "examples": [
          {
            "text": "She opened a bank account to save for college.",
            "translation": "她开了一个银行账户来为上大学攒钱。",
            "style": "neutral",
            "difficulty": "original"
          }
        ]
      }
    ],
    "collocations": ["open a bank account", "joint account"],
    "synonyms": ["checking account"],
    "antonyms": [],
    "derivations": ["account holder"]
  },
  "detailLevel": "medium",
  "exampleCount": 3,
  "profileApplied": { "goals": ["academic"], "level": "B2", "styleTags": ["formal"] },
  "createdAt": "2025-11-08T03:20:00Z"
}
```

约束与行为：

- 同语模式（en→en 或 zh→zh）时 `translation` 字段必为 `null` 或省略。 
- `detailLevel ∈ {short, medium, long}`，字符预算参考“统一详略级别基线”。 
- `exampleCount` 及 `styleTags` 上限受订阅档位约束。 

------

## 9.4 查词与再生成

### API-001 查词/生成

- **方法与路径**：`POST /api/v1/lookup`
- **鉴权**：必需
- **幂等**：支持。推荐 `Idempotency-Key: hash(userId+entry+config)`
- **限流与配额**：计入“每日查词上限”与速率限制。 

**请求体**

```json
{
  "entry": "bank account",
  "langPair": { "source": "en", "target": "zh" },
  "modules": {
    "definitions": true,
    "examples": true,
    "collocations": true,
    "synonymsAntonyms": true,
    "derivations": true
  },
  "detailLevel": "medium",
  "exampleCount": 3,
  "difficulty": "original",
  "style": { "register": "neutral", "tags": ["formal"] },
  "context": "finance",
  "forceNoTranslate": false
}
```

- 规则与校验：
  - `entry` 仅接受单词或词组；检测疑似整句时返回 400（错误码 `ENTRY_NOT_WORD_OR_PHRASE`），与第 1.4.2 节一致。 
  - `langPair` 必须属于白名单 {L1…L4}。同语模式不输出译文。 
  - `exampleCount` 上限：普通=1、Plus≤3、Pro≤5。超限返回 400（`EXAMPLE_COUNT_EXCEEDS_TIER`）。 
  - `style.tags` 上限：普通≤3、Plus≤5、Pro≤8。超限 400。 

**响应体**（`200 OK`）

- 返回 `DictResult`。当命中缓存时附加 `X-Cache: HIT`，否则 `MISS`。缓存策略与 TTL 参照 1.4.7。 

**错误码**：见 9.11。

------

### API-002 再生成

- **方法与路径**：`POST /api/v1/lookup/{lookupId}/regenerate`
- **鉴权**：必需
- **配额**：计入“再生成次数/日”。不同于“查词上限”。 

**请求体**

```json
{
  "exampleCount": 3,
  "difficulty": "easier",
  "style": { "register": "colloquial", "tags": ["business"] }
}
```

**响应体**：同 API-001。`lookupId` 不变，返回 `iteration` 自增。

------

### API-003 获取单次结果

- **方法与路径**：`GET /api/v1/lookup/{lookupId}`
- **说明**：用于详情回放；不消耗配额。

------

## 9.5 历史与数据控制

> 留存、清理与导出遵循分层策略与删除语义（逻辑删即刻，物理清理 7 天后）。 

### API-101 列表历史

- **方法与路径**：`GET /api/v1/history?langGroup=en|zh|all&limit=50&cursor=...`
- **响应体**

```json
{
  "items": [
    {
      "historyId": "h_001",
      "lookupId": "lk_123",
      "entry": "bank account",
      "langPair": { "source": "en", "target": "zh" },
      "createdAt": "2025-11-08T03:20:00Z"
    }
  ],
  "nextCursor": "eyJvZmZzZXQiOjEwMH0="
}
```

### API-102 删除单条

- **方法与路径**：`DELETE /api/v1/history/{historyId}`
- **语义**：逻辑删除即时生效；物理清理延迟 7 天。 

### API-103 按语言清理或全部清空

- **方法与路径**：`POST /api/v1/history:clear`
- **请求体**：`{ "scope": "en|zh|all" }`
- **响应**：`202 Accepted`，返回清理任务 `taskId` 与预计完成时间（≤5 秒）。完成后投递回执（见 9.8）。 

------

## 9.6 导出

### API-201 申请导出

- **方法与路径**：`POST /api/v1/exports`
- **请求体**：`{ "format": "csv|json", "filters": { "langGroup": "en|zh|all" } }`
- **响应**：`202 Accepted`

```json
{ "exportId": "ex_123", "status": "processing", "receiptId": "rc_789" }
```

- 处理完成 SLA：≤5 秒；生成一次性下载链接，TTL 10 分钟。返回回执号与下载链接。 

### API-202 查询导出状态

- **路径**：`GET /api/v1/exports/{exportId}`
- **响应**：

```json
{
  "exportId": "ex_123",
  "status": "finished",
  "downloadUrl": "https://.../download?sig=...",
  "expiresAt": "2025-11-08T03:21:00Z",
  "receiptId": "rc_789"
}
```

> CSV/JSON 字段脱敏与表头固定；CSV 采用 UTF-8。 

------

## 9.7 用户画像与偏好

### API-301 读取画像

- **方法与路径**：`GET /api/v1/profile`
- **响应体（摘要）**

```json
{
  "goals": ["academic","writing"],
  "backgrounds": ["finance"],
  "ageBand": "25-34",
  "level": { "type": "CEFR", "value": "B2" },
  "defaultLangPair": { "source": "en", "target": "zh" },
  "styleTags": ["formal","concise"]
}
```

### API-302 更新画像

- **方法与路径**：`PATCH /api/v1/profile`
- **约束**：`styleTags` 上限随档位 3/5/8；越界 400。档位规则见 1.4.4。 

------

## 9.8 订阅、配额与回执

### API-401 查询订阅状态

- **方法与路径**：`GET /api/v1/subscription`
- **响应体**

```json
{
  "plan": "plus", 
  "entitlements": {
    "dailyLookupLimit": 100,
    "dailyRegenerateLimit": 10,
    "historyRetentionDays": 90,
    "styleTagsMax": 5
  },
  "expiresAt": "2026-02-01T00:00:00Z",
  "state": "active"
}
```

> 档位矩阵与自动降级策略参见 1.4.4–1.4.5。 

### API-402 查询配额用量

- **方法与路径**：`GET /api/v1/quotas`
- **响应体**：`{ "lookup": { "used": 12, "limit": 100 }, "regenerate": { "used": 2, "limit": 10 } }`

### API-403 导出回执查询

- **方法与路径**：`GET /api/v1/receipts/{receiptId}`
- **响应体**：`{ "receiptId": "rc_789", "type": "export", "status": "delivered", "deliveredAt": "..." }`

### API-404 支付/订阅 Webhook（入站）

- **方法与路径**：`POST /api/v1/webhooks/billing`
- **鉴权**：`X-Signature: sha256=...`（HMAC with shared secret）
- **事件**：`subscription.activated|renewed|expired|canceled|refunded`
- **响应**：`200 OK`（要求幂等）；失败重试使用指数退避。

------

## 9.9 配置发现与能力边界

### API-501 拉取配置

- **方法与路径**：`GET /api/v1/config`
- **响应体**

```json
{
  "langWhitelist": [
    { "code": "L1", "source": "zh", "target": "en" },
    { "code": "L2", "source": "en", "target": "zh" },
    { "code": "L3", "source": "en", "target": "en" },
    { "code": "L4", "source": "zh", "target": "zh" }
  ],
  "detailLevelBudget": { "short": { "zh": 80, "en": 120 }, "medium": { "zh": 150, "en": 220 }, "long": { "zh": 220, "en": 320 } },
  "modules": ["definitions","examples","collocations","synonymsAntonyms","derivations"],
  "unsupported": ["frequency","examTags"]  // 暂不实现
}
```

> 统一详略级别基线与白名单与第 1 章一致。 

------

## 9.10 错误模型与码表

### 9.10.1 统一错误体

```json
{
  "error": {
    "code": "ENTRY_NOT_WORD_OR_PHRASE",
    "message": "Only words or short phrases are allowed.",
    "hint": "Try removing punctuation or splitting the sentence.",
    "traceId": "3bd2f9..."
  }
}
```

### 9.10.2 典型错误码

| HTTP | code                       | 说明                                |
| ---- | -------------------------- | ----------------------------------- |
| 400  | ENTRY_NOT_WORD_OR_PHRASE   | 输入检测为整句或过长，违反 1.4.2。  |
| 400  | INVALID_LANG_PAIR          | 语言对不在白名单。                  |
| 400  | EXAMPLE_COUNT_EXCEEDS_TIER | 例句条数超过档位上限。              |
| 400  | STYLE_TAGS_EXCEEDS_TIER    | 风格标签超过档位上限。              |
| 401  | UNAUTHORIZED               | 未提供或无效的 Bearer Token。       |
| 403  | FORBIDDEN                  | RBAC 或档位不允许。                 |
| 404  | NOT_FOUND                  | 资源不存在。                        |
| 409  | IDEMPOTENCY_KEY_REPLAYED   | 幂等键重放且参数不一致。            |
| 422  | CONTRACT_VALIDATION_FAILED | 与 `glancy.dict.v1` 契约不一致。    |
| 429  | RATE_LIMITED               | 触发限速；返回剩余冷却。            |
| 429  | QUOTA_EXCEEDED_LOOKUP      | 超出“每日查词上限”。                |
| 429  | QUOTA_EXCEEDED_REGENERATE  | 超出“再生成次数/日”。               |
| 500  | UPSTREAM_UNAVAILABLE       | Doubao 或第三方异常；触发降级策略。 |
| 503  | CIRCUIT_OPEN               | 熔断中，快速失败。                  |

------

## 9.11 Doubao 适配层（内部服务契约）

> 该层对上提供稳定的结构化输出，对下与 Doubao API 通信，包含重试、超时、错误语义化与解析容错。遇异常时回退到“基础释义与模板例句”，并携带退化提示。参照 1.4.7。 

### 9.11.1 请求（Adapter → Doubao）

```json
{
  "promptVersion": "glancy.dict.v1",
  "entry": "bank account",
  "langPair": { "source": "en", "target": "zh" },
  "controls": {
    "detailLevel": "medium",
    "exampleCount": 3,
    "difficulty": "original",
    "styleTags": ["formal"]
  },
  "profile": {
    "goals": ["academic"],
    "backgrounds": ["finance"],
    "level": { "type": "CEFR", "value": "B2" }
  }
}
```

### 9.11.2 响应（Doubao → Adapter）

```json
{
  "ok": true,
  "payload": {
    "definitions": [
      {
        "pos": "n",
        "gloss": "a record of money...",
        "translation": "银行账户",
        "examples": [
          { "text": "She opened...", "translation": "她开了..." }
        ]
      }
    ],
    "collocations": ["open a bank account"],
    "synonyms": ["checking account"],
    "antonyms": [],
    "derivations": ["account holder"]
  },
  "tokensIn": 321,
  "tokensOut": 512,
  "elapsedMs": 820
}
```

### 9.11.3 适配输出（Adapter → 应用层）

- 将 `payload` 正规化为 `DictResult`，并在失败或半失败时附加：

```json
{ "degraded": true, "degradeReason": "UPSTREAM_UNAVAILABLE" }
```

- 记录计量：`tokens_in/out` 计入成本统计；写入可观测性指标。 

------

## 9.12 JSON Schema（关键对象精简版）

> 采用 Draft 2020-12；仅给出关键字段与校验要点。

### 9.12.1 `#/definitions/LangPair`

```json
{
  "$id": "https://glancy/schema/langpair.json",
  "type": "object",
  "required": ["source", "target"],
  "properties": {
    "source": { "enum": ["en", "zh"] },
    "target": { "enum": ["en", "zh"] }
  },
  "allOf": [
    { "not": { "properties": { "source": { "const": "en" }, "target": { "const": "fr" } } } }
  ]
}
```

### 9.12.2 `#/definitions/Example`

```json
{
  "type": "object",
  "required": ["text"],
  "properties": {
    "text": { "type": "string", "minLength": 1, "maxLength": 320 },
    "translation": { "type": ["string", "null"] },
    "style": { "enum": ["colloquial","neutral","formal","academic","business"] },
    "difficulty": { "enum": ["easier","original","harder"] }
  }
}
```

### 9.12.3 `#/definitions/Definition`

```json
{
  "type": "object",
  "required": ["gloss"],
  "properties": {
    "senseId": { "type": "string" },
    "pos": { "enum": ["n","v","adj","adv","prep","pron","conj","det","num","phr","idiom"] },
    "gloss": { "type": "string", "maxLength": 220 },
    "translation": { "type": ["string","null"] },
    "examples": { "type": "array", "items": { "$ref": "#/definitions/Example" }, "maxItems": 5 }
  }
}
```

### 9.12.4 `#/definitions/DictResult`

```json
{
  "type": "object",
  "required": ["contract","lookupId","entry","langPair","modules","createdAt"],
  "properties": {
    "contract": { "const": "glancy.dict.v1" },
    "lookupId": { "type": "string" },
    "entry": { "type": "string", "minLength": 1, "maxLength": 80 },
    "langPair": { "$ref": "#/definitions/LangPair" },
    "sameLang": { "type": "boolean" },
    "modules": {
      "type": "object",
      "properties": {
        "definitions": { "type": "array", "items": { "$ref": "#/definitions/Definition" }, "maxItems": 3 },
        "collocations": { "type": "array", "items": { "type": "string" }, "maxItems": 10 },
        "synonyms": { "type": "array", "items": { "type": "string" }, "maxItems": 8 },
        "antonyms": { "type": "array", "items": { "type": "string" }, "maxItems": 8 },
        "derivations": { "type": "array", "items": { "type": "string" }, "maxItems": 5 }
      },
      "additionalProperties": false
    },
    "detailLevel": { "enum": ["short","medium","long"] },
    "exampleCount": { "type": "integer", "minimum": 1, "maximum": 5 },
    "profileApplied": { "type": "object" },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

------

## 9.13 安全与权限约束（接口侧）

- **RBAC**：读（自有资源）默认允许；导出、后台操作需显式角色授权（最小权限）。 
- **输入拦截**：敏感词与违规内容直接拒绝，返回 400 并写入审计日志。原文不落库。 
- **下载链接**：一次性、限时（TTL 10 分钟）、绑定用户。 

------

## 9.14 兼容性与前后端协作要点

- **模块开关与顺序**：普通档仅“开/关”，Plus/Pro 支持顺序与详略调节；请求体中的 `modules` 与 `detailLevel` 由前端根据档位控制。 
- **同语模式**：UI 不展示译文位；服务端同样不返回 `translation`，以防前端误渲染。 
- **降级提示**：当 `degraded=true` 时，前端在结果页显式展示退化徽标与文案。 

------

### 附：端到端示例

**请求**

```http
POST /api/v1/lookup HTTP/1.1
Authorization: Bearer eyJ...
Content-Type: application/json
Accept: application/vnd.glancy.dict.v1+json
Idempotency-Key: 9f0b4d3c...

{
  "entry": "bank account",
  "langPair": { "source": "en", "target": "zh" },
  "modules": { "definitions": true, "examples": true, "collocations": true, "synonymsAntonyms": true, "derivations": true },
  "detailLevel": "medium",
  "exampleCount": 3,
  "difficulty": "original",
  "style": { "register": "neutral", "tags": ["formal"] }
}
```

**响应**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Trace-Id: 3bd2f9...
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1731045600
X-Quota-Type: lookup
X-Quota-Remaining: 88
X-Cache: MISS
{
  "contract": "glancy.dict.v1",
  "lookupId": "lk_123",
  "entry": "bank account",
  "langPair": { "source": "en", "target": "zh" },
  "sameLang": false,
  "modules": {
    "definitions": [
      {
        "senseId": "s_1",
        "pos": "n",
        "gloss": "a record of money held by a bank for a customer",
        "translation": "银行账户",
        "examples": [
          {
            "text": "She opened a bank account to save for college.",
            "translation": "她开了一个银行账户来为上大学攒钱。",
            "style": "neutral",
            "difficulty": "original"
          }
        ]
      }
    ],
    "collocations": ["open a bank account","close an account","joint account"],
    "synonyms": ["checking account","current account"],
    "antonyms": [],
    "derivations": ["account holder"]
  },
  "detailLevel": "medium",
  "exampleCount": 3,
  "profileApplied": { "goals": ["academic"], "level": "B2", "styleTags": ["formal"] },
  "createdAt": "2025-11-08T03:20:00Z"
}
```

------

> 以上完成第 9 章所需的接口与数据契约定义，严格对齐“输入与查词规则”“分层功能说明”“导出与删除语义”“档位与权益矩阵”“技术实现最小集”等既有条款。后续章节（第 10–13 章）中的数据模型、安全与合规将沿用本文的字段与错误模型作为接口层约束基线。 