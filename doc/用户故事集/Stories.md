# 用户故事集（Story Inventory）

> 与 `StoryMap.md` 对齐的 34 条 INVEST 用户故事，全部绑定 `doc/用例说明书` 中的 UC-01 ~ UC-05，并指向相应 AC，附带 Gherkin 风格验收标准与 SLA/KPI 映射。

## 用户故事明细

### ST-01 输入校验阻挡句子查询
- **用户故事**：作为需要精准释义的学习者，我希望系统阻止整句输入并指引我改为词或词组，以避免浪费查询配额。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：输入校验命中率 ≥ 99%；错误提示渲染延迟 < 150ms。
- **INVEST**：Independent（仅处理输入校验）、Negotiable（提示样式可调）、Valuable（减少失败请求）、Estimable（校验逻辑明确）、Small（单组件）、Testable（校验响应可自动化）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Block sentence lookup at client side
  Given 用户在输入框粘贴一个超过 15 个词的句子
  When 点击“查询”
  Then 前端阻止请求并提示“请改为词或词组”
```

### ST-02 首屏流式分片达成 SLA
- **用户故事**：作为需要即时反馈的用户，我希望查词后首屏在 2.5 秒内渲染首个释义分片，确保体验顺滑。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01-PERF
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：首屏首个内容分片 P95 ≤ 2.5s；平均 ≤ 1.2s。
- **INVEST**：Independent（聚焦首屏时延）、Negotiable（加载指示可调）、Valuable（提升满意度）、Estimable（链路清晰）、Small（单流程）、Testable（压测脚本可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Streamed lookup renders first chunk within SLA
  Given 查词 API 正常可用
  When 用户提交查询
  Then 2.5 秒内渲染首个释义模块并展示加载状态
```

### ST-03 模块化流式渲染
- **用户故事**：作为深入学习者，我希望释义、例句、搭配等模块随着分片到达逐步渲染，避免页面闪烁。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01-Stream
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：分片间隔 ≤ 400ms；渲染错误率 < 0.5%。
- **INVEST**：Independent（聚焦分片渲染）、Negotiable（模块布局可调）、Valuable（提高可读性）、Estimable（契约固定）、Small（单渲染策略）、Testable（可脚本检测 DOM）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Sections render as chunks arrive
  Given 流式响应包含多个模块分片
  When 第 n 个分片抵达
  Then 对应模块插入 DOM 且已渲染内容不闪动
```

### ST-04 缓存命中与 Header 指示
- **用户故事**：作为高频用户，我希望在命中缓存时看到明显提示与 `X-Cache` Header，判断结果是否最新。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：缓存命中标识正确率 100%；提示渲染延迟 < 150ms。
- **INVEST**：Independent（仅处理缓存提示）、Negotiable（提示样式可调）、Valuable（增强信任）、Estimable（字段固定）、Small（单组件）、Testable（响应 Header 可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Display cache hit indicator
  Given BFF 返回 Header X-Cache: HIT
  When 页面渲染结果
  Then 展示“来自缓存”徽标并保留 trace_id
```

### ST-05 配额消耗透明化
- **用户故事**：作为订阅用户，我希望每次查询都能看到本次消耗、剩余额度与重置时间，避免意外限流。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01-Quota
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：Quota Header 呈现率 100%；剩余额度误差 0。
- **INVEST**：Independent（聚焦配额展示）、Negotiable（UI 可调）、Valuable（提升透明度）、Estimable（字段有限）、Small（单组件）、Testable（自动化断言 Header）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Quota header shows remaining credits
  Given 响应 Header 含 X-Quota-Remaining 与 X-Quota-Reset-At
  When 客户端渲染查词结果
  Then 页面展示本次消耗、剩余额度与重置时间
```

### ST-06 历史与事件落库闭环
- **用户故事**：作为希望回顾记录的用户，我需要成功查询能写入 `lookups`、`results`、`history` 并广播成功事件。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：落库成功率 ≥ 99.9%；事件发送延迟 < 2s。
- **INVEST**：Independent（聚焦落库与事件）、Negotiable（事件 payload 可调）、Valuable（支持历史与导出）、Estimable（流程清晰）、Small（单链路）、Testable（检查数据库与事件日志）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Persist lookup history and emit success event
  Given 查词响应 200 且未开启无痕
  When 请求完成
  Then lookups、results、history 三表写入成功并产生 query.success 事件
```

### ST-07 语言对切换重查
- **用户故事**：作为多语言用户，我希望切换语言对后自动清理缓存并重新查询当前词条。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：语言切换后重查 P95 ≤ 2.5s；缓存清理 < 200ms。
- **INVEST**：Independent（聚焦切换行为）、Negotiable（选择器样式可调）、Valuable（减少手动步骤）、Estimable（流程有限）、Small（单交互）、Testable（可模拟切换操作）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Switching language triggers fresh lookup
  Given 当前语言为 英→中
  When 用户切换到 中→英
  Then 客户端清理缓存并重新发起查词请求
```

### ST-08 幂等键与缓存层策略
- **用户故事**：作为追求稳定性的用户，我希望重复请求能命中 24 小时幂等缓存，避免重复扣配额。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：幂等命中率 ≥ 95%；重复扣配额 0 次。
- **INVEST**：Independent（聚焦幂等策略）、Negotiable（缓存键细节可调）、Valuable（节省成本）、Estimable（规则明确定义）、Small（单服务变更）、Testable（重复请求日志可验）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Repeat request served from idempotent cache
  Given 用户在 10 分钟内重复查询同一词条
  When BFF 收到相同幂等键
  Then 返回缓存结果且不额外扣减查词配额
```

### ST-09 权益差异与模块裁剪
- **用户故事**：作为免费档用户，我希望系统在命中受限模块时提示升级，并裁剪例句数量。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：裁剪提示覆盖率 100%；提示渲染延迟 < 200ms。
- **INVEST**：Independent（聚焦权益提示）、Negotiable（文案可调）、Valuable（促进升级）、Estimable（条件明确）、Small（单提示流程）、Testable（模拟免费档响应）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Free tier receives truncated examples
  Given 免费档用户查询受限模块
  When BFF 返回裁剪后的 exampleCount
  Then 前端展示裁剪提示并附带“升级解锁更多”入口
```

### ST-10 无障碍与 aria-live 提示
- **用户故事**：作为依赖读屏的用户，我希望流式过程中仅播报一次“正在加载”，并在降级时播报退化提示。
- **关联 UC**：UC-01
- **覆盖 AC**：AC-UC-01-Stream
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：ARIA 播报一次性成功率 100%；降级播报延迟 < 1s。
- **INVEST**：Independent（聚焦可访问性）、Negotiable（提示文本可调）、Valuable（符合无障碍要求）、Estimable（规则明确）、Small（单播报策略）、Testable（读屏测试可执行）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Screen reader announces streaming status once
  Given 读屏模式开启
  When 流式查词开始
  Then aria-live 提示仅播报一次加载状态并在降级时追加一次退化说明
```

### ST-11 熔断触发降级路径
- **用户故事**：作为依赖可用性的用户，我希望在 Doubao 5xx ≥5% 时自动启用降级模板而非报错。
- **关联 UC**：UC-02
- **覆盖 AC**：AC-UC-14
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：熔断触发→降级响应 ≤ 5s；降级响应 P95 ≤ 1.8s。
- **INVEST**：Independent（聚焦熔断判断）、Negotiable（阈值可配）、Valuable（保障体验）、Estimable（状态机明确）、Small（单流程）、Testable（模拟 5xx 可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Circuit opens when upstream error rate is high
  Given 最近 1 分钟 Doubao 5xx 比例 ≥ 5%
  When 新的查词请求进入
  Then 系统跳过主链路并返回 degraded=true 的模板响应
```

### ST-12 降级提示横幅
- **用户故事**：作为终端用户，我希望在降级时看到明显提示，避免误以为查询失败。
- **关联 UC**：UC-02
- **覆盖 AC**：AC-UC-14
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：提示渲染延迟 ≤ 200ms；误报率 < 1%。
- **INVEST**：Independent（聚焦提示）、Negotiable（样式可调）、Valuable（提升信任）、Estimable（触发条件明确）、Small（单组件）、Testable（模拟降级验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Degradation banner appears when fallback triggers
  Given 响应字段 degraded=true
  When 前端渲染页面
  Then 顶部展示“已降级”横幅并支持键盘关闭
```

### ST-13 成本护栏触发策略
- **用户故事**：作为运营人员，我希望当成本护栏 ≥95% 时查词改走强缓存，再生成直接返回 403 并提示原因。
- **关联 UC**：UC-02
- **覆盖 AC**：AC-UC-14-Guardrail
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：护栏触发响应 ≤ 5s；错误提示准确率 100%。
- **INVEST**：Independent（聚焦护栏策略）、Negotiable（阈值可配）、Valuable（控制成本）、Estimable（规则明确）、Small（单策略）、Testable（模拟护栏条件）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Cost guardrail bypasses regeneration
  Given 成本护栏指标 ≥ 95%
  When 用户点击“再生成”
  Then 返回 403 GUARDRAIL_ACTIVE 并提示原因及稍后重试建议
```

### ST-14 半开探测与回滚
- **用户故事**：作为可靠性工程师，我希望半开状态仅允许 3 次探测，失败立即回滚为 Open 并告警。
- **关联 UC**：UC-02
- **覆盖 AC**：AC-UC-14-HalfOpen
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：半开探测窗口 3 次；失败回滚延迟 < 1s。
- **INVEST**：Independent（聚焦状态机）、Negotiable（探测次数可配）、Valuable（缩短故障时长）、Estimable（逻辑明确）、Small（单状态流）、Testable（注入故障验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Half-open failures revert to open state
  Given 熔断状态为 HALF_OPEN
  When 探测请求返回错误
  Then 状态立即切回 OPEN 并触发告警事件
```

### ST-15 降级观测指标与 Runbook
- **用户故事**：作为值班 SRE，我希望降级时自动上报 `doubao.circuit_state`、`degrade.rate` 并生成 Runbook 任务。
- **关联 UC**：UC-02
- **覆盖 AC**：AC-UC-14
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：观测指标上报完整率 100%；Runbook 创建延迟 < 60s。
- **INVEST**：Independent（聚焦观测）、Negotiable（指标集合可调）、Valuable（缩短恢复时间）、Estimable（指标列表固定）、Small（单监控项）、Testable（观测数据可查）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Degradation emits observability metrics
  Given 熔断进入 OPEN 状态
  When 降级响应发送
  Then 指标 doubao.circuit_state 与 degrade.rate 上报且创建 lookup-availability Runbook
```

### ST-16 模板缓存回退与备份
- **用户故事**：作为用户，我希望降级模板缓存失效时仍可从备份对象存储加载，保证内容完整。
- **关联 UC**：UC-02
- **覆盖 AC**：AC-UC-14
- **里程碑/批次**：M1 · Alpha · 核心查词与可用性
- **SLA/KPI 绑定**：模板回源成功率 ≥ 99.9%；回源延迟 < 1s。
- **INVEST**：Independent（聚焦模板加载）、Negotiable（备份位置可调）、Valuable（保证服务可用）、Estimable（流程有限）、Small（单回源流程）、Testable（清空缓存验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Fallback template loads from backup storage
  Given 本地模板缓存不可用
  When 降级流程启动
  Then 系统从对象存储加载模板并继续返回 degraded 响应
```

### ST-17 导出任务创建 202 回执
- **用户故事**：作为需要备份的用户，我希望提交导出后在 5 秒内收到包含 exportId 与预计完成时间的回执。
- **关联 UC**：UC-03
- **覆盖 AC**：AC-UC-06
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：创建接口 P95 ≤ 5s；回执字段完整率 100%。
- **INVEST**：Independent（聚焦创建流程）、Negotiable（回执字段可扩展）、Valuable（增强可控性）、Estimable（步骤有限）、Small（单接口）、Testable（API 测试可执行）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Export creation returns receipt within SLA
  Given 用户已登录且有导出权限
  When 调用 POST /api/v1/exports
  Then 5 秒内收到 202 响应并包含 exportId、receiptId、estimatedReadyAt
```

### ST-18 导出格式与订阅权限校验
- **用户故事**：作为产品经理，我希望导出格式与订阅档位匹配，Free 仅能选 CSV，Plus/Pro 可选 CSV/JSON。
- **关联 UC**：UC-03
- **覆盖 AC**：AC-UC-06
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：权限校验准确率 100%；提示渲染延迟 < 200ms。
- **INVEST**：Independent（聚焦权限校验）、Negotiable（提示文案可调）、Valuable（防止越权）、Estimable（规则明确）、Small（单校验）、Testable（不同档位用例可验）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Export options reflect subscription entitlement
  Given 当前订阅为 Free
  When 打开导出面板
  Then 仅展示 CSV 选项并提示升级可解锁 JSON
```

### ST-19 导出配额与并发限制
- **用户故事**：作为运营人员，我希望当导出配额耗尽时返回 429 并提示重置时间与升级入口。
- **关联 UC**：UC-03
- **覆盖 AC**：AC-UC-06
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：配额 429 提示准确率 100%；提示渲染延迟 < 200ms。
- **INVEST**：Independent（聚焦配额提示）、Negotiable（文案可调）、Valuable（提升透明度）、Estimable（条件明确）、Small（单提示）、Testable（模拟配额用尽）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Export quota exhaustion returns guidance
  Given 用户当日导出次数已达上限
  When 再次调用 POST /api/v1/exports
  Then 返回 429 Rate Limited 并展示重置时间与升级 CTA
```

### ST-20 下载链接 TTL 与过期提示
- **用户故事**：作为导出申请人，我希望下载链接仅在 10 分钟内有效，并在过期时得到明确提示。
- **关联 UC**：UC-03
- **覆盖 AC**：AC-UC-06-TTL
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：下载链接 TTL = 600s；过期提示覆盖率 100%。
- **INVEST**：Independent（聚焦下载链接）、Negotiable（提示可调）、Valuable（保障安全）、Estimable（规则固定）、Small（单流程）、Testable（等待过期验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Download link expires after ten minutes
  Given exportId 状态为 finished
  When 用户在 10 分钟后点击下载链接
  Then 返回 410 EXPORT_LINK_EXPIRED 并提示重新申请导出
```

### ST-21 导出状态轮询与通知
- **用户故事**：作为耐心等待的用户，我希望在导出准备就绪时通过状态轮询或邮件通知及时得知。
- **关联 UC**：UC-03
- **覆盖 AC**：AC-UC-06
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：状态轮询返回完成状态 ≤ 5s；通知发送成功率 ≥ 98%。
- **INVEST**：Independent（聚焦通知）、Negotiable（渠道可调）、Valuable（减少等待焦虑）、Estimable（流程固定）、Small（单任务）、Testable（模拟完成状态）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Polling reveals export completion
  Given exportId 已经生成下载链接
  When 客户端调用 GET /api/v1/exports/{id}
  Then 返回 status=finished 并附带 downloadUrl 或触发邮件通知
```

### ST-22 导出产物 T+7 清理
- **用户故事**：作为隐私合规负责人，我需要导出文件在 T+7 天自动删除并记录 `export.deleted` 事件。
- **关联 UC**：UC-03
- **覆盖 AC**：AC-UC-06-Backlog
- **里程碑/批次**：M2 · Beta · 数据导出与合规控制
- **SLA/KPI 绑定**：清理任务成功率 100%；延迟 ≤ T+7d。
- **INVEST**：Independent（聚焦清理任务）、Negotiable（运行时机可调）、Valuable（降低风险）、Estimable（流程清晰）、Small（单批任务）、Testable（模拟过期文件）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Export artifact purged after retention window
  Given 导出文件创建已超过 7 天
  When 清理任务运行
  Then 删除对象存储文件并写入 export.deleted 事件
```

### ST-23 订阅计划展示与确认
- **用户故事**：作为潜在付费用户，我希望在订阅页看到各档位权益、价格与周期，并确认同意条款后下单。
- **关联 UC**：UC-04
- **覆盖 AC**：AC-UC-08
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：计划加载 P95 ≤ 1s；条款勾选率 100%。
- **INVEST**：Independent（聚焦展示与确认）、Negotiable（UI 可调）、Valuable（促成转化）、Estimable（数据来源固定）、Small（单页面）、Testable（端到端脚本可测）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Plan selection captures consent
  Given 用户打开订阅页
  When 选择 Plus 档并勾选条款
  Then 启用“立即升级”按钮并携带 consentId 创建订单
```

### ST-24 支付成功权益即时下发
- **用户故事**：作为升级用户，我希望支付成功后 5 秒内刷新档位与配额上限。
- **关联 UC**：UC-04
- **覆盖 AC**：AC-UC-08
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：支付成功→权益同步 ≤ 5s；Quota 更新成功率 100%。
- **INVEST**：Independent（聚焦同步）、Negotiable（刷新方式可调）、Valuable（减少等待）、Estimable（接口清晰）、Small（单流程）、Testable（模拟支付成功）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Subscription upgrade reflects within SLA
  Given 支付渠道返回成功
  When Webhook 生效
  Then /subscription 与 /quotas API 在 5 秒内返回新档位与上限
```

### ST-25 到期自动降级任务
- **用户故事**：作为已到期用户，我希望系统在订阅到期时自动降级并刷新限制，不需人工介入。
- **关联 UC**：UC-04
- **覆盖 AC**：AC-UC-09
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：到期任务延迟 ≤ 30s；失败率 < 0.5%。
- **INVEST**：Independent（聚焦到期任务）、Negotiable（任务频率可调）、Valuable（防止超额使用）、Estimable（状态机明确）、Small（单批任务）、Testable（模拟到期订阅）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Expired subscription auto-downgrades
  Given 用户订阅已到期
  When 定时任务运行
  Then subscriptions 状态变为 EXPIRED 并刷新权益为 Free 档
```

### ST-26 配额镜像刷新与缓存失效
- **用户故事**：作为升级用户，我希望权益变更后配额 API 与缓存立即失效刷新，防止短期内读到旧数据。
- **关联 UC**：UC-04
- **覆盖 AC**：AC-UC-08
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：缓存失效传播 < 5s；配额不一致窗口 ≤ 5s。
- **INVEST**：Independent（聚焦缓存刷新）、Negotiable（失效策略可调）、Valuable（保证一致性）、Estimable（流程有限）、Small（单缓存策略）、Testable（观察 API 响应）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Quota mirror refreshes after upgrade
  Given 用户刚完成升级
  When 客户端在 3 秒内调用 GET /api/v1/quotas
  Then 返回新的查词与再生成上限且不出现旧值
```

### ST-27 提前 72 小时到期提醒
- **用户故事**：作为续费潜在用户，我希望在订阅到期前 3 天收到包含续费入口的通知。
- **关联 UC**：UC-04
- **覆盖 AC**：AC-UC-09
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：提醒发送提前 ≥ 72h；送达率 ≥ 98%。
- **INVEST**：Independent（聚焦通知）、Negotiable（渠道可调）、Valuable（提升续费率）、Estimable（触发规则明确）、Small（单任务）、Testable（模拟时间窗口）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Expiry reminder sent three days ahead
  Given 用户订阅还有 3 天到期
  When 通知任务运行
  Then 发送包含续费入口与剩余天数的提醒
```

### ST-28 订阅审计与补偿回滚
- **用户故事**：作为合规审核者，我希望每次订阅变更记录 audit event，并在配额同步失败时自动发起补偿或回滚。
- **关联 UC**：UC-04
- **覆盖 AC**：AC-UC-08-Rollback
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：审计事件记录率 100%；补偿重试上限 3 次。
- **INVEST**：Independent（聚焦审计与补偿）、Negotiable（事件字段可调）、Valuable（确保一致性）、Estimable（流程明确）、Small（单任务）、Testable（模拟失败路径）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Entitlement rollback fires when quota sync fails
  Given 支付成功但配额服务 5 秒内未确认
  When 超时触发补偿
  Then 记录 plan.changed 审计事件并启动 entitlement.rollback 重试最多三次
```

### ST-29 订单创建携带金额与币种
- **用户故事**：作为升级用户，我希望下单时生成唯一 orderId，明确金额、币种与应付优惠。
- **关联 UC**：UC-05
- **覆盖 AC**：AC-FR-090
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：订单创建 P95 ≤ 1s；金额校验准确率 100%。
- **INVEST**：Independent（聚焦订单创建）、Negotiable（字段可扩展）、Valuable（支持支付）、Estimable（契约明确）、Small（单接口）、Testable（API 返回可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Order creation returns payment summary
  Given 用户选择年费 Plus 档
  When 调用 POST /v1/orders
  Then 返回 orderId、totalAmount、currency 与折扣信息
```

### ST-30 支付回调幂等处理
- **用户故事**：作为平台方，我希望支付渠道重复回调时系统能够幂等处理，避免重复扣费或发放权益。
- **关联 UC**：UC-05
- **覆盖 AC**：AC-FR-090
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：重复回调幂等冲突率 < 0.1%；处理延迟 < 1s。
- **INVEST**：Independent（聚焦幂等）、Negotiable（幂等键策略可调）、Valuable（防止错账）、Estimable（逻辑固定）、Small（单处理流程）、Testable（重放回调可验）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Duplicate webhook does not change state twice
  Given 同一订单收到两次成功回调
  When 第二次请求到达
  Then 返回 200 OK 但 orders 与 subscriptions 状态不再变更
```

### ST-31 账单与收据生成
- **用户故事**：作为需要报销的用户，我希望支付成功后立即生成账单记录并提供一次性收据下载链接。
- **关联 UC**：UC-05
- **覆盖 AC**：AC-FR-042
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：收据生成 ≤ 3s；链接 TTL 600s。
- **INVEST**：Independent（聚焦账单）、Negotiable（收据模板可调）、Valuable（满足报销）、Estimable（契约清晰）、Small（单流程）、Testable（检查数据库与链接）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Invoice record created after payment
  Given 订单状态更新为 paid
  When 账单服务处理事件
  Then 创建包含 plan、amount、tax 的 invoice 并返回一次性收据链接
```

### ST-32 退款与拒付回滚权益
- **用户故事**：作为财务人员，我希望渠道退款或拒付时系统自动回滚权益并生成红冲账单。
- **关联 UC**：UC-05
- **覆盖 AC**：AC-FR-092
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：退款回滚延迟 ≤ 5s；红冲记录生成率 100%。
- **INVEST**：Independent（聚焦退款）、Negotiable（通知文案可调）、Valuable（防止超用）、Estimable（状态机明晰）、Small（单流程）、Testable（模拟退款回调）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Refund callback rolls back entitlement
  Given 支付渠道发送退款回调
  When 系统处理通知
  Then orders 状态设为 refunded、subscriptions 降级并生成负数 invoice 行
```

### ST-33 对账任务识别差异
- **用户故事**：作为财务人员，我需要 15 分钟增量对账与 T+1 全量对账自动检测差异并触发补偿。
- **关联 UC**：UC-05
- **覆盖 AC**：AC-FR-092
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：对账任务延迟 ≤ 15 分钟；差异处理闭环率 100%。
- **INVEST**：Independent（聚焦对账）、Negotiable（补偿策略可调）、Valuable（避免财务风险）、Estimable（流程固定）、Small（单批任务）、Testable（注入差异验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Reconciliation job flags mismatched transactions
  Given 对账任务运行
  When 发现渠道成功但本地未更新的订单
  Then 标记 reconciliation_issue 并触发回调重放或人工告警
```

### ST-34 支付失败重试与客服引导
- **用户故事**：作为支付失败的用户，我希望看到明确失败原因、重试按钮和联系客服入口。
- **关联 UC**：UC-05
- **覆盖 AC**：AC-FR-090
- **里程碑/批次**：M3 · Release · 订阅变更与商业闭环
- **SLA/KPI 绑定**：失败提示覆盖率 100%；重试按钮点击成功率 ≥ 95%。
- **INVEST**：Independent（聚焦失败兜底）、Negotiable（提示文案可调）、Valuable（降低流失）、Estimable（场景有限）、Small（单界面）、Testable（模拟失败回调）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Failed payment shows retry guidance
  Given 支付渠道返回 insufficient_funds
  When 客户端渲染支付结果
  Then 展示失败原因、重试支付按钮与客服联系方式
```
