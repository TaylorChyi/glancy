# FR-070 Doubao API 适配与容错（Must）

- **前置**
  - 可以注入 Doubao 模拟器，控制返回成功/5xx/超时。
  - 监控熔断状态（`state=closed|open|half_open`）与 `degraded` 标记。
  - 查词配额监控需可区分降级路径的计数情况。
- **步骤**
  1. 正常调用 `POST /api/v1/lookup`，确认 Doubao 成功返回并记录基线响应时间。
  2. 将 Doubao 返回率设置为 10% 5xx 持续 1 分钟，观察熔断器进入 `open` 状态，前端显示“已降级”。
  3. 在熔断期间发起查词与再生请求，确认响应 `degraded=true`，内容降级为“基础释义+模板例句”，且 `X-Quota-Consumed=0`。
  4. 将 Doubao 恢复正常，触发半开探测（3 次成功），确认状态回到 `closed`，系统恢复高质量输出。
- **期望**
  - 熔断阈值命中后 60 秒内进入 open 状态，所有请求走降级路径并显示退化提示。
  - 降级请求不计入生成配额，日志上报 `degrade.reason=doubao_unhealthy`。
  - 半开阶段连续 3 次成功后自动恢复，`degraded` 标记消失，响应延迟回到基线。
- **数据**
  - API：`POST /api/v1/lookup`、`POST /api/v1/lookup/{id}/regenerate`。
  - 指标：`doubao.errors.rate`、`circuit_breaker_state`、`degrade.events`。
  - 词条：`articulate`。
- **优先级**：P0（Must）
- **关联 UC**：UC-01，UC-02，UC-03，UC-14
- **关联 AC**：AC-FR-070，AC-UC-02，AC-UC-03，AC-UC-14
