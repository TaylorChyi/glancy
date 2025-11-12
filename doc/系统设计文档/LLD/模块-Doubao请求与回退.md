# 模块：Doubao 请求构造与回退策略

## 1. 作用域

- 负责 BFF→LLM 适配层→Doubao API 的 prompt 管理、参数注入、流式解析与自动回退。
- `defaultStream` 为主路径，`fallbackStream` 或模板降级为兜底；需满足第 13 章降级覆盖率 100%、第 16 章段内预算、第 20 章验收门槛。

## 2. 请求构造

| 要素            | 设计                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Prompt 模板     | `system` + `instruction` + `user` 三段式；根据语言对、profile（Free/Plus/Pro）插入策略分支。          |
| 参数            | `temperature=0.2`,`top_p=0.85`,`max_tokens` 依据词条长度动态计算；`stream=true`。                      |
| 上下文          | 包含最近 1 次查询意图、订阅档位特性（例句数量、语料来源），遵循最少必要数据原则。                       |
| 幂等元数据      | `Idempotency-Key`,`request_id`,`trace_id` 透传，方便日志对账。                                          |
| 错误模型对齐    | 统一将 Doubao 错误映射到 BFF 的 `error.code`，并写入 `reason` 以便告警。                                 |

### 2.1 伪代码

```pseudo
composePrompt(ctx):
    template = loadTemplate(ctx.langPair, ctx.subscriptionTier)
    lexeme = normalize(ctx.query)
    return {
        system: template.system,
        instruction: fill(template.instruction, ctx),
        user: lexeme,
        examples: ctx.profile.examples
    }
```

## 3. 流控与回退

| 场景                     | 触发阈值                                                            | 行为                                                                                             |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 默认成功路径             | `defaultStream` 在 2.3 s 内返回首 chunk                             | 透传 chunk；记录 `latency_ms`，写命中缓存                                                         |
| `defaultStream` 超时     | BFF 2.3 s 超时或适配层 3 s 超时                                     | 立即返回模板降级；异步向适配层发起 `fallbackStream`（不阻塞用户）                                 |
| Doubao 4xx（限速/输入）  | `rate_limit_exceeded` 等                                            | 返回 429/400，标记 `retry_after`；同时触发成本护栏策略（第 13 章 13.1.2）                          |
| Doubao 5xx               | 连续 2 次 5xx 或 1 次超时                                           | 触发熔断（60 s）、转入降级响应；半开阶段 5% 流量探测                                              |
| fallbackStream 成功      | `fallbackStream` 首 chunk < 1.5 s                                   | 刷新缓存、更新模板版本                                                                            |
| fallbackStream 失败      | 继续 5xx/超时                                                       | 退化为静态模板 + `degraded=true`，记录故障事件，触发 SRE Runbook（第 13 章 13.5）                 |

## 4. 时序图

- FigJam 链接：<https://www.figma.com/file/glancy-sdd-figjam?type=whiteboard&node-id=2-200#LLD-Doubao>
- Mermaid 源：`doc/系统设计文档/图/LLD-Doubao-Sequence.mmd`

## 5. 日志与指标

| 指标                               | 说明                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `llm_default_stream_latency_ms`    | 每次 defaultStream 延迟；用于验证 P95 ≤3 s                  |
| `llm_fallback_stream_total`        | fallbackStream 调用计数；与降级比对                         |
| `llm_circuit_breaker_state`        | Open/Closed/Half-open；支持可观测性演练（第 20 章 20.14）   |
| `llm_prompt_template_version`      | 当前模板版本，便于调试 cache miss 的回源行为               |

## 6. 安全与合规

- Prompt 仅包含必要上下文；任何可识别信息在进入适配层前脱敏/散列。
- 请求日志在 7 天后裁剪正文，仅保留统计字段，符合第 20 章 20.3 数据语义要求。

