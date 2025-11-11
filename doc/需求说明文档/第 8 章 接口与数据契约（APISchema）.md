# 第 8 章 接口与数据契约（API/Schema）

> 版本说明：本章已根据 `com.glancy.backend` Java 服务与前端 `website` 目录下的现有实现（2025-02）对齐，移除 v1 草案中未落地的接口假设，便于研发、QA 与文档保持单一事实源。

---

## 8.1 基线规范

| 项目 | 当前实现 | 说明 |
| --- | --- | --- |
| 基地址 | `/api` | 前端 `API_PATHS` 与所有 Spring Controller 的 `@RequestMapping` 均使用 `/api` 前缀，无版本号。 【F:website/src/core/config/api.js†L1-L21】【F:backend/src/main/java/com/glancy/backend/controller/WordController.java†L20-L54】 |
| 内容类型 | `application/json` | 控制器返回 `ResponseEntity` JSON；上传文件仅限头像接口。 |
| 鉴权 | `Authorization: Bearer <token>` 对应 `@AuthenticatedUser` | 鉴权由安全配置注入 `@AuthenticatedUser`，未显式读取 `userId` 查询参数。 【F:backend/src/main/java/com/glancy/backend/controller/WordController.java†L33-L54】 |
| 追踪信息 | `HttpServletRequest` 属性 `req.id`、`auth.token.status` | 由 `TokenTraceFilter` 写入，日志使用。 |
| 错误模型 | `{"message": "..."}` | `GlobalExceptionHandler` 统一封装，状态码与业务异常映射表见 8.4。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L18-L109】 |
| 额外请求参数 | Spring 默认忽略未声明参数 | 现状允许前端传入 `userId`、`versionId` 等冗余查询参数而不会报错。 |

---

## 8.2 当前实现表格

### 8.2.1 查词与版本浏览

| 编号 | 方法 | 路径 | 鉴权 | 请求要点 | 响应要点 | 代码 |
| --- | --- | --- | --- | --- | --- | --- |
| API-001 | GET | `/api/words` | 必需登录 | `term`、`language`、可选 `flavor`、`model`、`forceNew`、`captureHistory`；忽略额外 `userId`、`versionId` | `WordResponse`：释义、例句、派生字段、`flavor` 等。 | 【F:backend/src/main/java/com/glancy/backend/controller/WordController.java†L33-L54】【F:backend/src/main/java/com/glancy/backend/dto/WordResponse.java†L10-L30】 |
| API-002 | GET | `/api/words/{recordId}/versions` | 必需登录 | 路径变量 `recordId` | `SearchRecordVersionSummary` 列表，含版本号、模型与摘要。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchResultVersionController.java†L30-L39】 |
| API-003 | GET | `/api/words/{recordId}/versions/{versionId}` | 必需登录 | 路径变量 `recordId`、`versionId` | `SearchResultVersionResponse`，包含正文 Markdown、模型、时间。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchResultVersionController.java†L41-L70】 |

### 8.2.2 搜索历史（SearchRecord）

| 编号 | 方法 | 路径 | 鉴权 | 请求要点 | 响应要点 | 代码 |
| --- | --- | --- | --- | --- | --- | --- |
| API-004 | POST | `/api/search-records/user` | 必需登录 | `SearchRecordRequest`：`term`、`language`、可选 `flavor`；服务层校验会员日限。 | `SearchRecordResponse`，携带最新版本摘要列表。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L41-L49】 |
| API-005 | GET | `/api/search-records/user` | 必需登录 | 可选 `page`、`size`；默认最近记录。 | 列表形式返回 `SearchRecordResponse`。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L54-L64】 |
| API-006 | DELETE | `/api/search-records/user` | 必需登录 | 无 | 204，无体。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L69-L74】 |
| API-007 | POST | `/api/search-records/user/{recordId}/favorite` | 必需登录 | 路径变量 `recordId` | 标记收藏后返回 `SearchRecordResponse`。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L79-L84】 |
| API-008 | DELETE | `/api/search-records/user/{recordId}/favorite` | 必需登录 | 路径变量 | 204，无体。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L89-L94】 |
| API-009 | DELETE | `/api/search-records/user/{recordId}` | 必需登录 | 路径变量 | 204，无体。 | 【F:backend/src/main/java/com/glancy/backend/controller/SearchRecordController.java†L99-L104】 |

### 8.2.3 文字转语音（TTS）

| 编号 | 方法 | 路径 | 鉴权 | 请求要点 | 响应要点 | 代码 |
| --- | --- | --- | --- | --- | --- | --- |
| API-010 | POST | `/api/tts/word` | 必需登录 | JSON `TtsRequest`；`shortcut` 默认 `true`。 | `TtsResponse`（音频二进制、毫秒长度、缓存标记），命中配额/限流时抛异常。 | 【F:backend/src/main/java/com/glancy/backend/controller/TtsController.java†L57-L102】【F:backend/src/main/java/com/glancy/backend/dto/TtsResponse.java†L10-L25】 |
| API-011 | GET | `/api/tts/word` | 必需登录 | Query：`text`、`lang`、可选 `voice`、`format`、`speed`；内部转换为 `TtsRequest` 并强制 `shortcut=false`。 | 同上。 | 【F:backend/src/main/java/com/glancy/backend/controller/TtsController.java†L84-L102】 |
| API-012 | POST | `/api/tts/sentence` | 必需登录 | JSON `TtsRequest` | `TtsResponse`。 | 【F:backend/src/main/java/com/glancy/backend/controller/TtsController.java†L107-L126】 |
| API-013 | GET | `/api/tts/sentence` | 必需登录 | 与 API-011 类似。 | `TtsResponse`。 | 【F:backend/src/main/java/com/glancy/backend/controller/TtsController.java†L132-L150】 |
| API-014 | GET | `/api/tts/voices` | 必需登录 | Query `lang` | 返回 `VoiceResponse`（默认音色 + 可选项），已按会员等级过滤。 | 【F:backend/src/main/java/com/glancy/backend/controller/TtsController.java†L169-L177】【F:backend/src/main/java/com/glancy/backend/service/tts/VolcengineTtsService.java†L69-L84】 |

### 8.2.4 纠错与兑换

| 编号 | 方法 | 路径 | 鉴权 | 请求要点 | 响应要点 | 代码 |
| --- | --- | --- | --- | --- | --- | --- |
| API-015 | POST | `/api/word-reports` | 必需登录 | `WordIssueReportRequest`：词条、语言、风味、问题类型、可选描述与来源。 | `WordIssueReportResponse`，含创建时间。 | 【F:backend/src/main/java/com/glancy/backend/controller/WordIssueReportController.java†L27-L35】【F:backend/src/main/java/com/glancy/backend/dto/WordIssueReportRequest.java†L10-L17】 |
| API-016 | POST | `/api/redemption-codes` | 管理端 | 创建兑换码配置，校验时间窗、总次数与单人次数。 | `RedemptionCodeResponse`，回显配置。 | 【F:backend/src/main/java/com/glancy/backend/controller/RedemptionCodeController.java†L35-L40】【F:backend/src/main/java/com/glancy/backend/service/redemption/RedemptionCodeService.java†L62-L86】 |
| API-017 | GET | `/api/redemption-codes/{code}` | 管理/客服 | 通过编码查询兑换码。 | `RedemptionCodeResponse`。 | 【F:backend/src/main/java/com/glancy/backend/controller/RedemptionCodeController.java†L45-L50】 |
| API-018 | POST | `/api/redemption-codes/redeem` | 必需登录 | `RedemptionRedeemRequest`；服务层校验有效期、总额度、单人次数并触发权益处理。 | `RedemptionRedeemResponse`，可能包含会员延长或折扣权益。 | 【F:backend/src/main/java/com/glancy/backend/controller/RedemptionCodeController.java†L55-L62】【F:backend/src/main/java/com/glancy/backend/service/redemption/RedemptionCodeService.java†L101-L145】 |

### 8.2.5 前端调用快照

| 模块 | 关键实现 | 说明 |
| --- | --- | --- |
| 词典查询 | `createWordsApi` | 前端统一拼接 `/api/words` 查询参数、缓存版本、控制是否采集历史。 | 【F:website/src/shared/api/words.js†L19-L117】 |
| API 基座 | `API_PATHS` | 所有调用共享 `/api` 前缀，含 TTS、历史、兑换等路径。 | 【F:website/src/core/config/api.js†L1-L21】 |

---

## 8.3 目标契约表格（与差异）

为保持与现有代码一致，目标契约采用“当前实现 + 未实现功能列表”方式呈现：

| 序号 | 目标契约项 | 当前状态 | 处置 |
| --- | --- | --- | --- |
| TGT-001 | `GET /api/words/audio`：返回纯音频 Blob，供前端 `fetchWordAudio` 复用 | **未实现**：后端缺少对应 Controller；前端调用将 404 | 需新建 Issue，讨论是否实现或移除前端缓存逻辑。 【F:website/src/shared/api/words.js†L119-L128】 |
| TGT-002 | `versionId` 查询参数回放指定版本 | **未实现**：后端 `WordController` 未接收 `versionId` | 需评估是否支持；若不支持应清理前端多余参数。 【F:backend/src/main/java/com/glancy/backend/controller/WordController.java†L33-L54】【F:website/src/shared/api/words.js†L79-L107】 |
| TGT-003 | 查词/历史响应返回配额/速率剩余额度字段 | **未实现**：当前无响应头/体；仅 TTS 抛异常信息 | 建议新增统一响应头或 JSON 字段，避免用户侧缺乏反馈。 |

其余接口目标契约与 8.2 表格一致。

---

## 8.4 错误码与异常映射

| 状态码 | 抛出源 | 说明 |
| --- | --- | --- |
| 400 Bad Request | `MissingServletRequestParameterException`、`MethodArgumentTypeMismatchException` 等 | Spring 参数缺失/类型错误直接映射。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L98-L107】 |
| 401 Unauthorized | `UnauthorizedException` | 鉴权失败。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L78-L83】 |
| 403 Forbidden | `QuotaExceededException`、`ForbiddenException` | TTS 配额不足、会员等级不足等情况。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L88-L95】 |
| 404 Not Found | `ResourceNotFoundException`、`NoHandlerFoundException` | 资源不存在或路径错误。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L65-L76】【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L111-L124】 |
| 409 Conflict | `DuplicateResourceException` | 兑换码重复创建等。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L69-L72】 |
| 422 Unprocessable Entity | `InvalidRequestException`、校验异常 | 业务参数校验失败，例如日限超额。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L73-L87】 |
| 429 Too Many Requests | `RateLimitExceededException` | TTS 速率限制触发。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L96-L101】 |
| 424 Failed Dependency | `TtsFailedException` | 上游 TTS 提供方异常。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L102-L109】 |
| 500 Internal Server Error | 兜底异常 | 未分类错误。 【F:backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java†L125-L132】 |

所有异常统一序列化为 `{"message": "..."}`，便于前端直接展示。 【F:backend/src/main/java/com/glancy/backend/dto/ErrorResponse.java†L10-L13】

---

## 8.5 差异追踪（需建 Issue）

1. **补齐 `/api/words/audio` 或移除前端调用**：当前调用会 404，应决定交付策略并记录 Issue。 【F:website/src/shared/api/words.js†L119-L128】
2. **决定是否支持 `versionId` 重放**：前端仍附带该参数，后端未实现。建议在 Issue 中确认需求，避免歧义。 【F:website/src/shared/api/words.js†L79-L107】【F:backend/src/main/java/com/glancy/backend/controller/WordController.java†L33-L54】
3. **配额/限流提示**：若产品需展示剩余额度，应在响应头或体中补充一致的字段。当前仅依赖异常提示文案。 【F:backend/src/main/java/com/glancy/backend/service/tts/quota/TtsQuotaService.java†L34-L75】

上述事项在后续冲刺中需登记到 Issue 追踪并评估实现优先级。
