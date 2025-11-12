# 用户故事集（Story Inventory）

> 与 `StoryMap.md` 对齐的 32 条 INVEST 用户故事，全部绑定 doc/用例说明书/README.md 中的 UC，并提供 Gherkin 风格验收标准与 SLA/KPI 映射。

## 用户故事明细

### ST-01 首屏流式查词响应
- **用户故事**：作为需要即时释义的学习者，我希望首屏在 2.5 秒内开始渲染释义，以便决定是否继续阅读。
- **关联 UC**：UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：词典查询首屏 P95 ≤ 2.5s，分片丢失率 ≤ 1%。
- **INVEST**：Independent（仅聚焦首屏渲染）、Negotiable（UI 形态可协商）、Valuable（缩短等待提升留存）、Estimable（API/渲染链路可量化）、Small（单次查词流程）、Testable（AC 提供可测条件）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Streamed lookup renders first chunk within SLA
  Given 用户已登录并输入查询词
  When 词典 API 返回首个流式分片
  Then 前端在 2.5 秒内显示释义首屏并展示加载指示
```

### ST-02 分段渲染字典结构
- **用户故事**：作为需要完整信息的学习者，我希望释义、例句、词性等模块随着流式分片逐段渲染，避免空白等待。
- **关联 UC**：UC-01
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：分片间隔 ≤ 400ms；每个段落渲染错误率 < 0.5%。
- **INVEST**：Independent（关注渲染序列）、Negotiable（分片布局可讨论）、Valuable（提升可读性）、Estimable（受 API 契约约束）、Small（单模块渲染）、Testable（渲染事件可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Sections render as chunks arrive
  Given 流式响应包含释义与例句分片
  When 第 n 个分片抵达前端
  Then 对应的模块即刻插入 DOM 并保持已有内容不闪动
```

### ST-03 查询配额头信息展示
- **用户故事**：作为订阅用户，我希望每次查询都能看到本次消耗和剩余额度，避免突发限流。
- **关联 UC**：UC-01，UC-13
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：Quota Header 呈现成功率 100%；剩余额度计算误差=0。
- **INVEST**：Independent（仅处理配额展示）、Negotiable（呈现样式可调）、Valuable（透明度提升转化）、Estimable（字段固定）、Small（单一组件）、Testable（Header 字段可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Quota header shows remaining credits
  Given 查词响应 Header 包含 X-Quota-Remaining 与 Reset-At
  When 客户端完成渲染
  Then 页面展示本次消耗与剩余额度并包含预估重置时间
```

### ST-04 流式状态与降级提示
- **用户故事**：作为依赖词典的学习者，我希望在网络抖动或降级时收到明确提示，避免误解为系统卡死。
- **关联 UC**：UC-01，UC-14
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：降级提示在异常判定 ≤ 200ms 内展现；误报率 < 1%。
- **INVEST**：Independent（聚焦状态提示）、Negotiable（提示样式可调）、Valuable（减少投诉）、Estimable（状态机清晰）、Small（单提示组件）、Testable（可模拟超时验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Degradation banner appears when fallback triggers
  Given 流式连接进入半开或熔断状态
  When 客户端触发降级策略
  Then 页面展示降级提示并引导用户稍后重试
```

### ST-05 一键再生成例句
- **用户故事**：作为语言学习者，我希望点击一次即可再生成例句，且响应不超过 1 秒，以便快速获得新的语境。
- **关联 UC**：UC-02
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：再生成响应 P95 ≤ 1.0s；失败率 < 1%。
- **INVEST**：Independent（仅聚焦再生成按钮）、Negotiable（触发位置可调）、Valuable（提升学习效率）、Estimable（单 API 调用）、Small（按钮+调用）、Testable（可通过 AC 自动化）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Regenerate sentences within SLA
  Given 用户在释义卡片点击“再生成”
  When 后端返回新的例句
  Then 页面替换旧例句并记录一次再生成配额
```

### ST-06 再生成多样性控制
- **用户故事**：作为高级用户，我希望选择“创意/保守”等多样性档位，以得到更符合场景的例句。
- **关联 UC**：UC-02
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：多样性分布指标 ≥ 0.7；设置到响应的延迟 < 300ms。
- **INVEST**：Independent（只涉及多样性参数）、Negotiable（档位数量可调）、Valuable（满足差异化需求）、Estimable（有限档位）、Small（表单+参数）、Testable（日志可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Diversity option affects regenerate payload
  Given 用户在再生成面板选择“创意”档位
  When 发送再生成请求
  Then Payload 包含 diversity=creative 且返回结果标记所选档位
```

### ST-07 难度切换实时生效
- **用户故事**：作为不同水平的学习者，我希望在释义卡片切换难度后即刻得到重算结果。
- **关联 UC**：UC-03
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：难度切换响应 ≤ 300ms；切换成功率 ≥ 99%。
- **INVEST**：Independent（仅难度切换）、Negotiable（展示形式可调）、Valuable（符合学习节奏）、Estimable（固定档位）、Small（控件+调用）、Testable（可脚本化）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Difficulty toggle recalculates result
  Given 当前难度为“标准”
  When 用户切换到“高级”
  Then 系统重新请求 UC-03 接口并以高级标签渲染释义
```

### ST-08 难度/风格偏好持久化
- **用户故事**：作为 Plus/Pro 用户，我希望偏好设置在账号级持久化，避免每次都手动切换。
- **关联 UC**：UC-03，UC-07
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：偏好写入 ≤ 200ms；命中率 ≥ 90%。
- **INVEST**：Independent（聚焦偏好存储）、Negotiable（字段可扩展）、Valuable（减少重复操作）、Estimable（受画像 Schema 限制）、Small（单表写入）、Testable（读写接口可测）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Saved preference auto-applies on next lookup
  Given 用户已保存“简洁+正式”偏好
  When 重新打开页面查询新单词
  Then 默认难度与风格采用保存值且无需额外点击
```

### ST-09 历史列表分页浏览
- **用户故事**：作为复习用户，我希望查询历史按时间倒序分页展示，以便快速定位最近的查词记录。
- **关联 UC**：UC-04
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：分页接口 P95 ≤ 1.2s；游标翻页错误率 < 0.5%。
- **INVEST**：Independent（仅列表读取）、Negotiable（分页大小可调）、Valuable（提升复习效率）、Estimable（接口固定）、Small（单界面）、Testable（接口响应可断言）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: History list returns paginated results
  Given 用户打开历史页
  When 请求第一页游标
  Then 返回 20 条最新记录并附下一页游标
```

### ST-10 历史筛选（语言/时间）
- **用户故事**：作为多语言用户，我希望按语言对与时间范围筛选历史记录，以便批量管理。
- **关联 UC**：UC-04，UC-05
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：筛选响应 ≤ 1.5s；筛选命中准确率 100%。
- **INVEST**：Independent（专注过滤条件）、Negotiable（过滤项可拓展）、Valuable（定位记录）、Estimable（条件有限）、Small（单筛选面板）、Testable（请求参数可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Filter history by language pair
  Given 历史中包含多个语言对
  When 用户选择“英-中”并设置最近 7 天
  Then 返回结果仅包含满足条件的记录
```

### ST-11 按语言清理历史
- **用户故事**：作为注重隐私的用户，我希望按语言对删除历史并立即生效。
- **关联 UC**：UC-05
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：逻辑删除即时；删除确认提示覆盖率 100%。
- **INVEST**：Independent（单一删除动作）、Negotiable（确认方式可调）、Valuable（减少噪音）、Estimable（单接口）、Small（单按钮）、Testable（删除结果可查询）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Delete history by language pair
  Given 用户在历史页选择“英-中”
  When 点击“删除所选语言对”并确认
  Then 该语言对记录立即从列表消失并记入待物理清除任务
```

### ST-12 全部历史清理与恢复提示
- **用户故事**：作为控制数据的用户，我希望清空全部历史时看到 T+7 天物理清理与恢复窗口说明。
- **关联 UC**：UC-05
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：提示弹窗覆盖率 100%；清空操作记录到审计日志。
- **INVEST**：Independent（聚焦全量删除）、Negotiable（提醒文案可调）、Valuable（降低误删风险）、Estimable（操作链清晰）、Small（一次动作）、Testable（日志可核对）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Full history wipe shows retention info
  Given 用户点击“清空全部历史”
  When 确认弹窗出现
  Then 弹窗说明逻辑删除即时、生效时间与 T+7d 物理清理及可恢复窗口
```

### ST-13 导出任务申请（CSV/JSON）
- **用户故事**：作为需要备份的用户，我希望选择 CSV/JSON 格式后立即收到导出任务回执。
- **关联 UC**：UC-06
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：回执生成 ≤ 5s；格式校验 100%。
- **INVEST**：Independent（仅导出申请）、Negotiable（格式可扩展）、Valuable（满足外部分析）、Estimable（任务流程固定）、Small（单操作）、Testable（回执内容可校验）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Export job returns receipt within SLA
  Given 用户在历史页选择 CSV 导出
  When 点击“生成导出”
  Then 在 5 秒内收到包含 jobId、格式与 TTL 的回执
```

### ST-14 下载导出回执链接
- **用户故事**：作为导出申请人，我希望在回执中心/邮件中拿到一次性链接，10 分钟内有效。
- **关联 UC**：UC-06
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：链接生成 ≤ 3s；TTL 准确率 100%。
- **INVEST**：Independent（关注下载环节）、Negotiable（通知渠道可调）、Valuable（完成导出）、Estimable（链接生命周期清晰）、Small（单链接生成）、Testable（TTL 可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Download link honors TTL
  Given jobId 状态为完成
  When 用户在 10 分钟内点击下载链接
  Then 链接返回文件且包含剩余 TTL；超过 TTL 时返回过期提示
```

### ST-15 画像字段管理
- **用户故事**：作为 Plus/Pro 用户，我希望在设置中心管理画像字段（语气、行业、难度权重）。
- **关联 UC**：UC-07
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：画像写入 API P95 ≤ 200ms；成功率 ≥ 99.9%。
- **INVEST**：Independent（聚焦画像 CRUD）、Negotiable（字段可扩展）、Valuable（驱动个性化）、Estimable（字段有限）、Small（单页面）、Testable（接口可测）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Profile update persists fields
  Given 用户在画像中心修改行业=“法律”
  When 点击保存
  Then 后端记录该字段并返回版本号，前端提示成功
```

### ST-16 画像驱动查询链路
- **用户故事**：作为已配置画像的用户，我希望所有查询自动带上画像参数以生成符合语气的结果。
- **关联 UC**：UC-07，UC-03
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：带画像请求比例 ≥ 95%；额外延迟 < 50ms。
- **INVEST**：Independent（聚焦参数注入）、Negotiable（参数映射可调）、Valuable（稳定体验）、Estimable（依赖固定 schema）、Small（单管线修改）、Testable（请求日志可验）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Lookup inherits profile context
  Given 用户画像定义 tone=formal
  When 发起任意查词
  Then 下游请求 Payload 包含 tone=formal 且返回结果标记该语气
```

### ST-17 订阅开通与支付提交流程
- **用户故事**：作为希望升级的用户，我要选择订阅档位并完成支付，5 秒内生效。
- **关联 UC**：UC-08
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：支付成功到权益生效 ≤ 5s；失败回退率 < 1%。
- **INVEST**：Independent（聚焦开通流程）、Negotiable（UI 可调）、Valuable（直接带来收入）、Estimable（支付链路既定）、Small（单流程）、Testable（交易用例可执行）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Subscription activates within SLA
  Given 用户在订阅页选择 Plus 年费档位
  When 完成支付并收到 PSP 成功回执
  Then 账户在 5 秒内显示新权益并刷新配额类型
```

### ST-18 支付回调与权益即时同步
- **用户故事**：作为系统集成者，我希望支付回调幂等处理，确保重复通知不会重复扣款。
- **关联 UC**：UC-08
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：回调幂等冲突率 < 0.1%；权益同步延迟 ≤ 5s。
- **INVEST**：Independent（只处理回调）、Negotiable（存储策略可调）、Valuable（防止错账）、Estimable（事件流程清晰）、Small（单服务）、Testable（可模拟重复回调）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Duplicate webhook handled idempotently
  Given PSP 针对同一订单发送两次成功回调
  When 后端处理第二次通知
  Then 返回 200 OK 但不重复创建订单记录
```

### ST-19 到期自动降级处理
- **用户故事**：作为订阅到期用户，我希望系统在权益到期时自动降级到免费档，并同步限制生效。
- **关联 UC**：UC-09
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：降级作业延迟 ≤ 30s；失败率 < 0.5%。
- **INVEST**：Independent（聚焦降级 job）、Negotiable（执行时间可调）、Valuable（避免权益错配）、Estimable（基于批任务）、Small（单作业）、Testable（可模拟到期用户）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Expired plan auto-downgrades
  Given 用户订阅已超出有效期
  When 定时任务运行
  Then 账户状态改为 Free 并刷新配额与提示横幅
```

### ST-20 降级前后通知
- **用户故事**：作为订阅用户，我希望提前 3 天收到到期提醒，并在降级完成后收到确认。
- **关联 UC**：UC-09
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：提醒发送提前 ≥ 72h；通知送达率 ≥ 98%。
- **INVEST**：Independent（专注通知链路）、Negotiable（通知渠道可定）、Valuable（提升续费率）、Estimable（触发规则固定）、Small（两类通知）、Testable（可用模拟 clock 验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Expiry reminder sent 3 days in advance
  Given 用户订阅还有 3 天到期
  When 系统执行提醒任务
  Then 用户收到包含续费入口与剩余天数的通知
```

### ST-21 邮箱注册登录并同意条款
- **用户故事**：作为新用户，我希望通过邮箱注册/登录并在首次使用时签署条款。
- **关联 UC**：UC-10
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：登录成功率 ≥ 98%；条款记录必填率 100%。
- **INVEST**：Independent（邮箱链路）、Negotiable（验证码或密码可调）、Valuable（开启体验入口）、Estimable（步骤有限）、Small（单链路）、Testable（登录流程可自动化）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Email login captures ToS consent
  Given 用户输入邮箱并通过验证码
  When 首次登录成功
  Then 系统要求勾选条款并记录 consentId
```

### ST-22 第三方 OAuth 并账号合并
- **用户故事**：作为已有第三方账号的用户，我希望用 OAuth 登录并自动与邮箱账号合并避免重复数据。
- **关联 UC**：UC-10
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：OAuth 成功率 ≥ 97%；合并冲突率 < 0.5%。
- **INVEST**：Independent（专注第三方登录）、Negotiable（支持平台可调）、Valuable（降低摩擦）、Estimable（少量流程）、Small（单链路）、Testable（可用沙盒验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: OAuth login merges existing email account
  Given 用户已用同一邮箱注册
  When 通过第三方 OAuth 登录
  Then 系统提示账号合并成功且历史记录保持唯一
```

### ST-23 无痕查询模式
- **用户故事**：作为注重隐私的用户，我希望开启无痕模式查询时不写入历史但仍计配额。
- **关联 UC**：UC-11
- **里程碑/批次**：M2 · Beta · 留存与个性化
- **SLA/KPI 绑定**：无痕查询不落库率 100%；提示展示率 100%。
- **INVEST**：Independent（聚焦无痕开关）、Negotiable（入口位置可调）、Valuable（提升信任）、Estimable（逻辑清晰）、Small（单 flag）、Testable（数据库可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Incognito lookup skips history persistence
  Given 用户在查词前开启“无痕模式”
  When 完成一次查词
  Then 该记录不出现在历史页但配额统计 +1
```

### ST-24 语言对切换即刻重查
- **用户故事**：作为双语用户，我希望切换语言对后自动清理缓存并重查当前单词。
- **关联 UC**：UC-12
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：缓存清理 < 200ms；重查 P95 ≤ 2.5s。
- **INVEST**：Independent（聚焦切换行为）、Negotiable（选择器 UI 可调）、Valuable（减少步骤）、Estimable（依赖既有 API）、Small（单操作）、Testable（可通过日志验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Switching language triggers fresh lookup
  Given 当前语言对为 英→中
  When 用户切换到 中→英
  Then 客户端清理旧缓存并重新发起查词请求
```

### ST-25 限流提示包含剩余额度
- **用户故事**：作为高频用户，我希望在限流时看到剩余额度与重置时间，便于安排查询。
- **关联 UC**：UC-13
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：429 响应提示 100% 包含剩余额度；文案渲染延迟 < 200ms。
- **INVEST**：Independent（聚焦限流提示）、Negotiable（提示样式可调）、Valuable（降低挫败感）、Estimable（字段有限）、Small（单组件）、Testable（可模拟 429）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Rate limit banner shows remaining credits
  Given API 返回 HTTP 429 与剩余额度 0
  When 客户端捕获该状态
  Then 页面展示剩余额度、重置时间及重试建议
```

### ST-26 限流时升级 CTA 与 SLA 建议
- **用户故事**：作为被限流的潜在付费用户，我希望看到可升级的套餐与预计恢复时间。
- **关联 UC**：UC-13
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：升级 CTA 曝光率 100%；点击转化率 ≥ 8%。
- **INVEST**：Independent（聚焦 CTA）、Negotiable（CTA 形式可调）、Valuable（促进转化）、Estimable（UI 轻量）、Small（单模块）、Testable（AB 数据可验）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Rate limit CTA deep-links to upgrade flow
  Given 用户命中限流
  When 查看提示
  Then 横幅包含“升级订阅”按钮并跳转到订阅页携带来源参数
```

### ST-27 熔断降级的模板释义
- **用户故事**：作为需要兜底内容的用户，我希望主链路失败时仍能收到基础释义和示例。
- **关联 UC**：UC-14
- **里程碑/批次**：M1 · Alpha · 核心查词
- **SLA/KPI 绑定**：降级响应 ≤ 800ms；fallback 呈现率 100%。
- **INVEST**：Independent（聚焦降级输出）、Negotiable（模板内容可调）、Valuable（保障可用性）、Estimable（模板固定）、Small（单流程）、Testable（可模拟熔断）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Fallback template renders when streaming fails
  Given 主查词调用失败并触发 UC-14
  When fallback 模块被调用
  Then 用户看到基础释义、例句与“已降级”提示
```

### ST-28 账单列表与收据查询
- **用户故事**：作为订阅用户，我希望查看历次账单，包含订单号、金额与状态。
- **关联 UC**：UC-15
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：账单列表 P95 ≤ 1.5s；字段完整率 100%。
- **INVEST**：Independent（聚焦账单查询）、Negotiable（展示字段可调）、Valuable（满足报销）、Estimable（接口清晰）、Small（单列表）、Testable（接口可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Billing list shows normalized entries
  Given 用户打开“账单与收据”
  When 请求账单列表
  Then 返回每条记录含订单号、金额、货币、状态与导出入口
```

### ST-29 收据下载（PDF/邮件）
- **用户故事**：作为企业用户，我希望将账单导出为 PDF 并可发送到绑定邮箱。
- **关联 UC**：UC-15
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：PDF 生成 ≤ 3s；邮件发送成功率 ≥ 99%。
- **INVEST**：Independent（聚焦收据导出）、Negotiable（格式可调）、Valuable（报销凭证）、Estimable（流程固定）、Small（单动作）、Testable（可通过集成测试验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Receipt download returns PDF link
  Given 用户在账单详情点击“下载收据”
  When 生成 PDF 成功
  Then 页面提供下载链接并可选发送到登记邮箱
```

### ST-30 撤回隐私同意立即生效
- **用户故事**：作为遵循 GDPR 的用户，我希望撤回隐私同意后立即停止非必要处理。
- **关联 UC**：UC-16
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：撤回执行 ≤ 5s；后续请求标记 consent=false。
- **INVEST**：Independent（聚焦 consent 状态）、Negotiable（入口可调）、Valuable（满足合规）、Estimable（状态机简单）、Small（单操作）、Testable（状态可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Consent withdrawal updates processing flags
  Given 用户在隐私中心点击“撤回非必要处理”
  When 确认操作
  Then 系统立即更新 consent 状态并提示后续功能受限
```

### ST-31 数据删除申请可追踪
- **用户故事**：作为隐私敏感用户，我希望提交删除申请并能追踪执行进度，最终在 T+7 天完成物理清理。
- **关联 UC**：UC-16
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：删除请求记录率 100%；完成时间 ≤ T+7d。
- **INVEST**：Independent（聚焦删除流程）、Negotiable（状态枚举可调）、Valuable（提升透明度）、Estimable（流程固定）、Small（单队列任务）、Testable（状态流可验证）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Data deletion request tracks lifecycle
  Given 用户提交删除申请
  When 查看申请详情
  Then 页面展示“已接收/处理中/已完成”并在 7 天内进入完成状态
```

### ST-32 支付异常兜底与重试路径
- **用户故事**：作为遇到支付问题的用户，我希望在失败时看到明确的错误说明、重试步骤或备用渠道。
- **关联 UC**：UC-08
- **里程碑/批次**：M3 · Gamma · 变现与合规
- **SLA/KPI 绑定**：失败提示展示率 100%；支持的重试路径覆盖 ≥ 2 种支付方式。
- **INVEST**：Independent（聚焦异常流程）、Negotiable（渠道可调）、Valuable（减少流失）、Estimable（场景有限）、Small（提示+重试逻辑）、Testable（可模拟 PSP 错误）。
- **验收标准（Gherkin）**：
```gherkin
Scenario: Failed payment shows retry guidance
  Given PSP 返回“insufficient_funds”失败
  When 客户端渲染支付结果
  Then 呈现失败原因、推荐重试支付方式及联系支持入口
```
