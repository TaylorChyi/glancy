# 第 8 章 接口与数据契约（APISchema）

> 本章在 MVP 范围内定义前后端、服务与第三方之间的接口与数据契约，覆盖鉴权、版本、限流与错误模型，以及“查词/再生成、历史、导出、用户画像、订阅/配额、配置发现、支付回调”和 Doubao 适配层的内部契约。所有 JSON 字段使用驼峰命名；不兼容变更采用版本演进与弃用期管理。本文与第 1–6 章口径一致，如有冲突，以“订阅矩阵与[附录 A 术语与缩略语](<./Appendix/附录 A 术语与缩略语.md>)”的单一事实源为准。 

## 8.0 对齐结果（T03，2025-02）

> 说明：为完成 “T03｜SRS 第 8–11 章与代码现状对齐”，本节先列出现状与目标的对照，并为每一项给出代码或测试溯源。8.1 以后保留原 SRS 目标契约，供后续迭代参照。

### 8.0.1 当前实现表（代码事实源）

| 能力 | 接口 / 方法 | 请求 & 字段 | 响应 & 行为 | 溯源 |
| --- | --- | --- | --- | --- |
| 词典查词 | `GET /api/words?term&language&flavor&model&forceNew&captureHistory`，`X-USER-TOKEN` 头或 `token` query | QueryString 由 `website/src/shared/api/words.js` 统一封装；`language ∈ {ENGLISH,CHINESE}`；`captureHistory=false` 可跳过历史记录 | 返回 `WordResponse`（`id/term/definitions/.../markdown/personalization/flavor`），无 `schemaVersion`、`quota` 字段；命中缓存仍走 GET。 | [WordController](../../backend/src/main/java/com/glancy/backend/controller/WordController.java)，[WordResponse](../../backend/src/main/java/com/glancy/backend/dto/WordResponse.java)，[words.test.js](../../website/src/shared/api/__tests__/words.test.js) |
| 搜索历史 | `POST/GET/DELETE /api/search-records/user`；收藏/取消收藏、单条删除分别为 `POST|DELETE /api/search-records/user/{recordId}/favorite` 与 `DELETE /api/search-records/user/{recordId}` | `SearchRecordRequest` 仅包含 `term/language/flavor`，每天非会员最多 10 次（`search.limit.nonMember`） | 列表返回 `SearchRecordResponse`（含版本摘要）；删除/清空返回 `204` | [SearchRecordController](../../backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java)，[SearchRecordService](../../backend/src/main/java/com/glancy/backend/service/SearchRecordService.java) |
| 结果版本 | `GET /api/words/{recordId}/versions` 与 `GET /api/words/{recordId}/versions/{versionId}` | 路径参数 + token | 列表返回 `SearchRecordVersionSummary`；详情返回 `SearchResultVersionResponse` | [SearchResultVersionController](../../backend/src/main/java/com/glancy/backend/controller/SearchResultVersionController.java) |
| TTS 合成 | `POST /api/tts/word|sentence`（JSON `TtsRequest`），GET 变体 `GET /api/tts/word|sentence?text&lang&voice&format&speed`；`GET /api/tts/voices?lang` | 请求包含 `text/lang/voice/format/mp3/speed`；GET 变体自动 `shortcut=false` | POST/GET 返回 `TtsResponse`（`data` base64、`duration_ms` 等），找不到缓存时返回 `204`；`/voices` 返回默认音色 + options | [TtsController](../../backend/src/main/java/com/glancy/backend/controller/TtsController.java)，[TtsRequest](../../backend/src/main/java/com/glancy/backend/dto/TtsRequest.java)，[tts.js](../../website/src/shared/api/tts.js) |
| 画像与偏好 | 画像：`POST/GET /api/profiles/user`；偏好：`POST|PATCH|GET /api/preferences/user` | JSON 直接对应 DTO（无 schemaVersion），均需 token | 返回 `UserProfileResponse` 或 `UserPreferenceResponse`，字段与实体等同 | [UserProfileController](../../backend/src/main/java/com/glancy/backend/controller/UserProfileController.java)，[UserPreferenceController](../../backend/src/main/java/com/glancy/backend/controller/UserPreferenceController.java) |
| 快捷键 | `GET /api/preferences/shortcuts/user`、`PUT /api/preferences/shortcuts/user/{action}`、`DELETE /api/preferences/shortcuts/user` | `KeyboardShortcutUpdateRequest` 仅含 `keys:string[]` | 返回 `KeyboardShortcutResponse`（每个动作的 key 列表）；冲突/非法输入返回 422 | [KeyboardShortcutController](../../backend/src/main/java/com/glancy/backend/controller/KeyboardShortcutController.java)，[keyboardShortcuts.js](../../website/src/shared/api/keyboardShortcuts.js) |
| 词条问题上报 | `POST /api/word-reports` | JSON `WordIssueReportRequest`（`term/language/flavor/category/description/sourceUrl`），token 校验 `@AuthenticatedUser` | `201` + `WordIssueReportResponse`（含 `id`、`createdAt`） | [WordIssueReportController](../../backend/src/main/java/com/glancy/backend/controller/WordIssueReportController.java)，[wordReports.js](../../website/src/shared/api/wordReports.js) |
| 兑换/会员 | `POST /api/redemption-codes`、`GET /api/redemption-codes/{code}`、`POST /api/redemption-codes/redeem` | `RedemptionCodeCreateRequest`、`RedemptionRedeemRequest`；redeem 需 token | 创建返回 `201`+配置；兑换返回会员/折扣快照，不触发任何 `/subscription` API | [RedemptionCodeController](../../backend/src/main/java/com/glancy/backend/controller/RedemptionCodeController.java)，[redemptionCodes.js](../../website/src/shared/api/redemptionCodes.js) |
| 账户鉴权 | `/api/users/register`、`/api/users/login`、`/api/users/login/email`、`/api/users/{id}/logout` 等 | 前端 `API_PATHS` 默认基地址 `/api`，令牌通过 `X-USER-TOKEN` 头传递 | 登录响应 `LoginResponse`（含 `token`, `membershipType`, `membershipExpiresAt`）；所有业务接口依赖 `TokenAuthenticationFilter` 注入 `@AuthenticatedUser` | [UserController](../../backend/src/main/java/com/glancy/backend/controller/UserController.java)，[TokenAuthenticationFilter](../../backend/src/main/java/com/glancy/backend/config/TokenAuthenticationFilter.java)，[website/src/core/config/api.js](../../website/src/core/config/api.js) |
| 错误模型 | 全局异常返回 `{"message": "..."}` 或 `{"message":"...", "rid":""}` | 无错误码枚举、无 `schemaVersion`、无 `error.meta` | 429/403/5xx 仅含 message；限流提示中文文案 | [GlobalExceptionHandler](../../backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java) |

### 8.0.2 目标契约表（原 SRS 摘要）

| 能力 / SRS 章节 | 约定 | 当前状态 | Issue |
| --- | --- | --- | --- |
| 8.1 基线：`/api/v1` 前缀、`Accept: application/vnd.glancy.dict.v1+json`、统一 `schemaVersion`、`quota` 头/体 | 仍使用 `/api`，未返回 `schemaVersion`、`quota`、`X-RateLimit-*` | 未实现 | ISSUE#T03-API-01 |
| 8.1.1 `GUEST` 会话 `POST /api/v1/sessions/guest`、`POST /api/v1/sessions/merge` | 无对应接口；仅凭手动注册/登录 | 未实现 | ISSUE#T03-API-02 |
| 8.3 `DictResult` 模块化字段、`tokensIn/out`、`degraded` | 现有 `WordResponse` 无 tokens / modules / degradations | 未实现 | ISSUE#T03-API-03 |
| 8.4 `POST /api/v1/lookup` / `regenerate` / `GET /lookup/{id}`，含 `moduleFlags`、`detailLevel`、`exampleCount` 校验 | 仅 `GET /api/words`，没有再生成、detailLevel、模块控制；也未区分查词/再生配额 | 与实现完全不符 | ISSUE#T03-API-04 |
| 8.5–8.7 历史分页 `cursor`、导出任务、删除异步回执 | 历史只支持 page/size；无导出与异步清理；删除立即软删 | 部分实现 | ISSUE#T03-API-05 |
| 8.8 偏好、画像、订阅/配额、配置发现分层 API | 偏好/画像已实现；订阅与配额 API 缺失；配置发现未实现 | 局部 | ISSUE#T03-API-06 |
| 8.9 Webhook / 事件（`subscription.*`、`billing.*`） | 无 webhook 输出 | 未实现 | ISSUE#T03-API-07 |
| 8.10 版本管理 / `Sunset` 头 | 未实现 | ISSUE#T03-API-08 |
| 8.11 错误码枚举（含 `error.meta.kind` = quota/ratelimit） | 仅 message 字符串 | ISSUE#T03-API-09 |

### 8.0.3 Issues（已登记）

- **ISSUE#T03-API-01**：缺少 `/api/v1` 基线能力（内容协商、`schemaVersion`、统一 quota header/body）。需为 `WordController` 等补充响应头与 body 字段，并在 `website` API 层兼容。来源：`WordController`。
- **ISSUE#T03-API-02**：`GUEST` session/合并接口未实现，导致 `FREE_USER`/`GUEST` 配额无法与 SRS 对齐。来源：`TokenAuthenticationFilter` 仅支持已注册用户。
- **ISSUE#T03-API-03**：`WordResponse` 未输出 `tokensIn/out`、`modules`、`degraded`，也无 `detailLevel`，与 8.3/8.4 要求冲突。来源：`WordResponse`、`WordSearcherImpl`。
- **ISSUE#T03-API-04**：再生成契约缺失，`WordService` 仅同步查词。需新增 `POST /lookup/{lookupId}/regenerate`。来源：`WordController`。
- **ISSUE#T03-API-05**：历史导出/清理契约缺失（8.5–8.6）；`SearchRecordService` 仅软删。需定义异步导出与 `cursor` 分页。来源：`SearchRecordController`。
- **ISSUE#T03-API-06**：配额/订阅/配置发现接口缺位（引用 8.8 & 第 10–11 章），UI 无法读取 quota。需在 `backend` 暴露 `/api/quotas` 或等效接口。
- **ISSUE#T03-API-07**：Webhook/事件未实现，订阅与计费域无法对接下游。来源：`backend` 缺少事件发布。
- **ISSUE#T03-API-08**：版本弃用流程和 `Sunset` 头缺失。需在响应中加入版本头并在 `WebConfig` 管理。来源：`WordController` 等。
- **ISSUE#T03-API-09**：错误响应无错误码或 `meta.kind`，无法区分 quota/ratelimit。来源：`GlobalExceptionHandler`。

### 8.0.4 示例请求 / 响应（与代码 & 前端测试对齐）

```http
GET /api/words?term=hello&language=ENGLISH&flavor=BILINGUAL&model=DOUBAO&captureHistory=true HTTP/1.1
X-USER-TOKEN: <token>
```

```json
{
  "id": "123",
  "term": "hello",
  "definitions": ["used as a greeting"],
  "language": "ENGLISH",
  "example": "Hello there!",
  "phonetic": "həˈləʊ",
  "synonyms": ["hi"],
  "markdown": null,
  "personalization": {
    "personaSummary": "...",
    "keyTakeaway": "...",
    "contextualExplanation": "...",
    "learningHooks": ["..."],
    "reflectionPrompts": ["..."]
  },
  "flavor": "BILINGUAL"
}
```

（响应字段取自 `WordResponse`，示例参数可在 `website/src/shared/api/__tests__/words.test.js` 复现。）

```http
POST /api/search-records/user HTTP/1.1
Content-Type: application/json
X-USER-TOKEN: <token>

{
  "term": "hello",
  "language": "ENGLISH",
  "flavor": "BILINGUAL"
}
```

```json
{
  "id": 501,
  "userId": 42,
  "term": "hello",
  "language": "ENGLISH",
  "flavor": "BILINGUAL",
  "createdAt": "2025-02-10T02:30:10.123",
  "favorite": false,
  "latestVersion": null,
  "versions": []
}
```

错误示例（超出 TTS 速率限制时）：

```json
{
  "message": "请5秒后重试"
}
```

（`GlobalExceptionHandler` 统一 message 字段，无错误码 / quota 元信息。）

------

## 8.1 基线规范

- 游客身份、配额与设备指纹的根本约束均引用[第 2 章 2.9](<./第 2 章 产品范围与目标.md#29-用户身份与模式定义>)，接口层仅实现对应 SSoT。

- **基地址**：`/api/v1`（内外统一），仅 HTTPS。
- **内容类型**：`Content-Type: application/json; charset=utf-8`。
  内容协商：`Accept: application/vnd.glancy.dict.v1+json` 优先；缺失或为 `application/json` 时降级为 JSON 并在响应体携带 `schemaVersion` 字段；出现未知 vendor 时返回 `406 Not Acceptable`。
- **鉴权**：`Authorization: Bearer <token>`，支持用户态 JWT（`user_jwt`）与 `GUEST` JWT（`guest_jwt`）；Webhook 采用 HMAC 签名。
- **主体 ID**：统一以 `subjectId = u_<userId> | s_<sessionId>` 参与幂等键、缓存键、配额与限速。
- **幂等**：写操作支持 `Idempotency-Key`（推荐值 `hash(subjectId+langPair+entryNorm+configHash+profileEtag)`）。参见“[附录 A 术语与缩略语](<./Appendix/附录 A 术语与缩略语.md>) - 幂等”。
- **跟踪**：请求头可携带 `X-Trace-Id`；响应统一回传同名头。
- **限流与配额回传**：
  - `X-RateLimit-Limit / Remaining / Reset`
  - `X-Quota-Type: lookup|regenerate`，`X-Quota-Remaining: <int>`，`X-Quota-Reset-At: <ISO8601>`
  - 响应体的 `quota` 对象镜像剩余次数与重置时间。
- **时间**：服务器存 UTC，客户端本地渲染；导出链接 TTL 10 分钟。 
- **分页**：列表接口使用游标分页：`?limit=50&cursor=<token>`；响应返回 `nextCursor`。
- **错误模型**：HTTP 状态码 + 统一错误体（见 9.11）。

### <a id="811-guest-session"></a>8.1.1 `GUEST` 会话（Guest Session）与 Token 获取

- **端点**：`POST /api/v1/sessions/guest`
- **作用**：签发 `GUEST` JWT（`guest_jwt`），scope 限定在查词、再生成与导出申请。
- **请求体**：
  ```json
  {
    "fingerprint": "hash(ua+platform+tz+ipClassC)",
    "deviceFingerprint": "sha256(ua|widthxheight|lang|tz|platform|uaVersion)",
    "locale": "zh-CN",
    "clientVersion": "web-1.0.0",
    "clientHints": {
      "uaFullVersion": "...",
      "secChUaPlatform": "..."
    }
  }
  ```
  `deviceFingerprint`：字符串，**必填**。按 12.4.2 中的字段组合与哈希算法生成，缺失时默认返回 `400 DEVICE_FINGERPRINT_REQUIRED`；若特性开关允许临时降级，则使用 IP 维度兜底，同时在响应头写入 `X-Quota-Warning: device_fingerprint_missing` 并记录 `quota_events`。
  `fingerprint`：保持现有游客会话逻辑，用于兼容历史 SDK；允许服务端在合并游客配额时继续追踪旧实现。
- **响应**：`201 Created`；响应头 `Set-Cookie: glancy_guest_session=<session_id>; HttpOnly; Secure; SameSite=Lax`。Body 可为空或返回 `{ "sessionId": "s_xxx", "quota": { ... } }` 供前端展示剩余额度。
- **约束**：TTL 24 h，可续签；`GUEST` 主体统一映射为 `subjectId = s_<sessionId>`；`GUEST` 配额为 `FREE_USER` 档日配额的 1/3（查词与再生成），阈值由特性开关配置；登录后可调用 `POST /api/v1/sessions/merge` 将 `GUEST` 配额并入真实用户。
- **配额与错误**：
  - 会话创建会校验“新建游客会话”IP 维度（详见 12.4.1）。超限返回 `429 GUEST_CREATION_LIMIT_EXCEEDED`。
  - 查词/LLM 请求需同时校验会话/IP/设备指纹 3 个维度，真实可用剩余额度取最小值；任一耗尽即返回 `429 LIMIT_EXCEEDED`，并在响应头 `X-Quota-*` 与体内 `quota` 对象带回 `session_remaining`、`ip_remaining`、`device_remaining`。
  - 清除 Cookie 仅影响会话维度；IP 和设备指纹维度继续沿用历史计数。
- **安全**：仅存储指纹哈希，不落真实指纹串；配额统计遵循 9.1 基线的 quota header/体规范。

------

## 8.2 契约版本与弃用

- 合同名：`glancy.dict.v1`（语义化版本）。不兼容升级发布 `v2` 并在旧版响应附加 `Sunset` 头与弃用日期。 

------

## 8.3 领域对象概览（JSON Schema 摘要）

> 以下为核心结构骨架（简化）。完整 JSON Schema 见各接口小节。

### 8.3.1 DictResult（查词结果骨架）

```json
{
  "schemaVersion": "glancy.dict.v1",
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
  "tokensIn": 321,
  "tokensOut": 512,
  "degraded": false,
  "degradeReason": null,
  "quota": { "type": "lookup", "remaining": 88, "resetAt": "2025-11-09T00:00:00Z" },
  "createdAt": "2025-11-08T03:20:00Z"
}
```

约束与行为：

- 同语模式（en→en 或 zh→zh）时 `translation` 字段必为 `null` 或省略。
- `detailLevel ∈ {short, medium, long}`，字符预算参考“统一详略级别基线”。
- `exampleCount` 及 `styleTags` 上限受订阅档位约束。
- `schemaVersion` 恒为 `glancy.dict.v1`；当客户端协商失败落回 JSON 时仍需输出该字段。
- `tokensIn/tokensOut` 记录模型用量，用于成本观测与限流联动。
- `degraded=true` 表示返回“基础释义 + 模板例句”降级内容；需与[第 13 章 可用性、容灾与备份](<./第 13 章 可用性、容灾与备份.md>)的降级约束一致，并附带 `degradeReason`（如 `UPSTREAM_UNAVAILABLE`、`BUDGET_GUARDRAIL`）。

------

## 8.4 查词与再生成

### API-001 查词/生成

- **方法与路径**：`POST /api/v1/lookup`
- **鉴权**：必需，支持 `user_jwt` 或 `guest_jwt`
- **幂等**：支持。推荐 `Idempotency-Key: hash(subjectId+langPair+entryNorm+configHash+profileEtag)`
- **限流与配额**：计入“每日查词上限”与速率限制。 

**请求体**

```json
{
  "entry": "bank account",
  "langPair": { "source": "en", "target": "zh" },
  "moduleFlags": {
    "definitions": true,
    "examples": true,
    "collocations": true,
    "synonyms": true,
    "antonyms": true,
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
  - `exampleCount` 上限：档位约束详见[第 11 章 订阅、计费与账单](<./第 11 章 订阅、计费与账单.md>)权益矩阵（`FREE_USER`≤1、`PLUS_USER`≤3、`PRO_USER`≤5），超限返回 400（`EXAMPLE_COUNT_EXCEEDS_TIER`）。
  - `style.tags` 上限：档位约束详见[第 11 章 订阅、计费与账单](<./第 11 章 订阅、计费与账单.md>)权益矩阵（`FREE_USER`≤3、`PLUS_USER`≤5、`PRO_USER`≤8），超限 400。

**响应体**（`200 OK`）

- 返回 `DictResult`，并附带 `quota` 对象（`type`、`remaining`、`resetAt`）。当命中缓存时附加 `X-Cache: HIT`，否则 `MISS`。缓存策略与 TTL 参照 1.4.7。
- 当触发降级或熔断回退时，`DictResult.degraded=true` 且 `degradeReason` 填充；字段语义与[第 13 章 可用性、容灾与备份](<./第 13 章 可用性、容灾与备份.md>) BCP 约束一致。

**错误码**：见 9.11。

> **游客配额超限响应体**：查词与 LLM 接口在命中 12.4.1 配额时必须返回以下结构，前端据此统一提示：

```json
{
  "errorCode": "LIMIT_EXCEEDED",
  "errorMessage": "Daily quota exceeded for guest user",
  "limitType": "GUEST_DAILY_LOOKUP"  // 或 GUEST_DAILY_LLM
}
```

同时设置 `HTTP 429`，在响应头 `X-Quota-Type`/`X-Quota-Remaining`/`X-Quota-Reset-At` 中回传剩余额度。

------

### API-002 再生成

- **方法与路径**：`POST /api/v1/lookup/{lookupId}/regenerate`
- **鉴权**：必需，支持 `user_jwt` 或 `guest_jwt`
- **配额**：计入“再生成次数/日”，与查词配额独立；难度或风格切换视为一次再生成，不计入查词次数。
  游客超限时返回与 API-001 相同的 `LIMIT_EXCEEDED` 错误体，`limitType = GUEST_DAILY_LLM`。

**请求体**

```json
{
  "exampleCount": 3,
  "difficulty": "easier",
  "style": { "register": "colloquial", "tags": ["business"] }
}
```

**响应体**：同 API-001，包含 `quota` 对象。`lookupId` 不变，返回 `iteration` 自增。

------

### API-003 获取单次结果

- **方法与路径**：`GET /api/v1/lookup/{lookupId}`
- **说明**：用于详情回放；不消耗配额。

------

## 8.5 历史与数据控制

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
- **响应**：`202 Accepted`，返回清理任务 `taskId`、预计完成时间（≤5 秒）与 `quota` 对象。完成后投递回执（见 9.8）。

------

## 8.6 导出

### API-201 申请导出

- **方法与路径**：`POST /api/v1/exports`
- **请求体**：`{ "format": "csv|json", "filters": { "langGroup": "en|zh|all" } }`
- **响应**：`202 Accepted`

```json
{ "exportId": "ex_123", "status": "processing", "receiptId": "rc_789", "quota": { "type": "export", "remaining": 2, "resetAt": "2025-11-09T00:00:00Z" } }
```

- 处理完成 SLA：P95 ≤ 5 s；前端轮询 1–2 次 `GET /api/v1/exports/{id}` 获取一次性下载链接（TTL 10 分钟 = 600 s）。响应体返回回执号与配额信息。

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

> CSV/JSON 字段脱敏与表头固定；CSV 采用 UTF-8。`downloadUrl` 为一次性令牌，超出 `expiresAt`（或生成后 600 s）即失效，再次访问返回 `410 Gone` + `EXPORT_LINK_EXPIRED` 错误体，需重新发起 `POST /api/v1/exports`。

------

## 8.7 用户画像与偏好

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
- **约束**：`styleTags` 上限随档位 3/5/8；越界 400。档位规则以[第 11 章 订阅、计费与账单](<./第 11 章 订阅、计费与账单.md>)为准。 

------

## 8.8 订阅、配额与回执

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

> 示例值仅用于说明，实际档位矩阵与自动降级策略以[第 11 章 订阅、计费与账单](<./第 11 章 订阅、计费与账单.md>)为准。

### API-402 查询配额用量

- **方法与路径**：`GET /api/v1/quotas`
- **响应体**：`{ "lookup": { "used": 12, "limit": 100, "resetAt": "2025-11-09T00:00:00Z" }, "regenerate": { "used": 2, "limit": 10, "resetAt": "2025-11-09T00:00:00Z" } }`

### API-403 导出回执查询

- **方法与路径**：`GET /api/v1/receipts/{receiptId}`
- **响应体**：`{ "receiptId": "rc_789", "type": "export", "status": "delivered", "deliveredAt": "..." }`

### API-404 支付/订阅 Webhook（入站）

- **方法与路径**：`POST /api/v1/webhooks/billing`
- **鉴权**：`X-Signature: sha256=...`（HMAC with shared secret）
- **事件**：`subscription.activated|renewed|expired|canceled|refunded`
- **响应**：`200 OK`（要求幂等）；失败重试使用指数退避。

------

## 8.9 配置发现与能力边界

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
  "modules": ["definitions","examples","collocations","synonyms","antonyms","derivations"],
  "unsupported": ["frequency","examTags"]  // 暂不实现
}
```

> 统一详略级别基线与白名单与[第 1 章 引言](<./第 1 章 引言.md>)一致。 

------

## 8.10 错误模型与码表

### 8.10.0 句子输入判定规范

系统仅接受“单词/词组”。满足任一硬规则即判定为“句子”，返回 `ENTRY_NOT_WORD_OR_PHRASE`：
a) 句末标点（英文 .?! 或中文 。！？；）；b) 英文 > 8 个词且含至少两个动词并由连词连接；c) 中文 ≥ 15 个汉字且包含 ≥2 个功能词序列。
命中软规则将提示确认或改写；命中短语白名单则放行。前端负责首次拦截，服务端兜底并返回统一错误体。

### 8.10.1 统一错误体

```json
{
  "error": {
    "code": "ENTRY_NOT_WORD_OR_PHRASE",
    "message": "Only words or short phrases are allowed.",
    "hint": "Try removing punctuation or splitting the sentence.",
    "meta": { "kind": "input" },
    "traceId": "3bd2f9..."
  }
}
```

### 8.10.2 典型错误码

| HTTP | code                       | 说明                                |
| ---- | -------------------------- | ----------------------------------- |
| 400  | ENTRY_NOT_WORD_OR_PHRASE   | 输入检测为整句或过长，违反 1.4.2。  |
| 400  | INVALID_LANG_PAIR          | 语言对不在白名单。                  |
| 400  | EXAMPLE_COUNT_EXCEEDS_TIER | 例句条数超过档位上限。              |
| 400  | STYLE_TAGS_EXCEEDS_TIER    | 风格标签超过档位上限。              |
| 400  | DEVICE_FINGERPRINT_REQUIRED | `POST /api/v1/sessions/guest` 缺少必填 `deviceFingerprint`。 |
| 401  | UNAUTHORIZED               | 未提供或无效的 Bearer Token。       |
| 403  | FORBIDDEN                  | RBAC 或档位不允许。                 |
| 404  | NOT_FOUND                  | 资源不存在。                        |
| 409  | IDEMPOTENCY_KEY_REPLAYED   | 幂等键重放且参数不一致。            |
| 410  | EXPORT_LINK_EXPIRED        | 导出下载链接超过 600 s TTL。         |
| 422  | CONTRACT_VALIDATION_FAILED | `schemaVersion` 或字段结构未符合 `glancy.dict.v1`。 |
| 429  | LIMIT_EXCEEDED             | 游客多维配额任一维度耗尽（会话/IP/设备）；`limitType` = `GUEST_DAILY_LOOKUP` 或 `GUEST_DAILY_LLM`。 |
| 429  | GUEST_CREATION_LIMIT_EXCEEDED | `POST /api/v1/sessions/guest` 命中“新建游客会话”IP 级配额；返回剩余次数与解封时间。 |
| 429  | RATE_LIMITED               | 通用限速或订阅档位配额触顶；`error.meta.kind` = 'quota'|'ratelimit'，返回剩余额度与重置时间。 |
| 500  | UPSTREAM_UNAVAILABLE       | Doubao 或第三方异常；触发降级策略。 |
| 503  | CIRCUIT_OPEN               | 熔断中，快速失败。                  |

------

## 8.11 Doubao 适配层（内部服务契约）

> 该层对上提供稳定的结构化输出，对下与 Doubao API 通信，包含重试、超时、错误语义化与解析容错。遇异常时回退到“基础释义与模板例句”，并携带退化提示。参照 1.4.7。 

### 8.11.1 请求（Adapter → Doubao）

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

### 8.11.2 响应（Doubao → Adapter）

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

### 8.11.3 适配输出（Adapter → 应用层）

- 将 `payload` 正规化为 `DictResult`，补齐 `schemaVersion` 常量与 `tokensIn/tokensOut` 计量字段，并在失败或半失败时附加：

```json
{ "degraded": true, "degradeReason": "UPSTREAM_UNAVAILABLE" }
```

- 记录计量：`tokens_in/out` 计入成本统计；写入可观测性指标。 

------

## 8.12 JSON Schema（关键对象精简版）

> 采用 Draft 2020-12；仅给出关键字段与校验要点。

### 8.12.1 `#/definitions/LangPair`

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

### 8.12.2 `#/definitions/Example`

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

> `Example.text` 使用 `langPair.source` 语言，同语模式下 `translation` 省略；跨语对时才返回译文。

### 8.12.3 `#/definitions/Definition`

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

### 8.12.4 `#/definitions/DictResult`

```json
{
  "type": "object",
  "required": ["schemaVersion","lookupId","entry","langPair","modules","createdAt"],
  "properties": {
    "schemaVersion": { "const": "glancy.dict.v1" },
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
    "tokensIn": { "type": "integer", "minimum": 0 },
    "tokensOut": { "type": "integer", "minimum": 0 },
    "degraded": { "type": "boolean" },
    "degradeReason": { "type": ["string","null"] },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

------

## 8.13 安全与权限约束（接口侧）

- **RBAC**：读（自有资源）默认允许；导出、后台操作需显式角色授权（最小权限）。 
- **输入拦截**：敏感词与违规内容直接拒绝，返回 400 并写入审计日志。原文不落库。 
- **下载链接**：一次性、限时（TTL 10 分钟）、绑定用户。 

------

## 8.14 兼容性与前后端协作要点

- **模块开关与顺序**：`FREE_USER` 档仅“开/关”，`PLUS_USER`/`PRO_USER` 支持顺序与详略调节；请求体中的 `moduleFlags` 与 `detailLevel` 由前端根据档位控制，响应体 `modules` 返回实际内容容器。
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
  "moduleFlags": { "definitions": true, "examples": true, "collocations": true, "synonyms": true, "antonyms": true, "derivations": true },
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
X-Quota-Reset-At: 2025-11-09T00:00:00Z
X-Cache: MISS
{
  "schemaVersion": "glancy.dict.v1",
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
  "tokensIn": 321,
  "tokensOut": 512,
  "degraded": false,
  "degradeReason": null,
  "quota": { "type": "lookup", "remaining": 88, "resetAt": "2025-11-09T00:00:00Z" },
  "createdAt": "2025-11-08T03:20:00Z"
}
```

------

> 以上完成第 8 章所需的接口与数据契约定义，严格对齐“输入与查词规则”“分层功能说明”“导出与删除语义”“档位与权益矩阵”“技术实现最小集”等既有条款。后续章节（[第 9 章 数据模型与数据治理](<./第 9 章 数据模型与数据治理.md>)、[第 10 章 配额、限流与成本控制](<./第 10 章 配额、限流与成本控制.md>)、[第 11 章 订阅、计费与账单](<./第 11 章 订阅、计费与账单.md>)、[第 12 章 安全、隐私与合规](<./第 12 章 安全、隐私与合规.md>)）中的数据模型、安全与合规将沿用本文的字段与错误模型作为接口层约束基线。
