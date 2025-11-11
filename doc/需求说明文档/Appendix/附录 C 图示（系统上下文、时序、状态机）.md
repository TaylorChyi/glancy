# 附录 C 图示（系统上下文、时序、状态机）

> 本附录采用 Mermaid 图示补充主体章节的叙述，帮助快速理解 Glancy 词汇助手的核心交互、边界与状态流转。除非另有说明，图中组件命名与《第 7 章 系统架构与组件》保持一致。

---

## C.1 系统上下文图

```mermaid
flowchart TB
    subgraph User[终端用户]
        Client[Web/H5 客户端]
        Admin[运营/客服后台]
    end

    subgraph Edge[边缘与接入层]
        CDN[CDN / WAF]
        APIGW[API 网关]
        AdminGW[后台入口网关]
    end

    subgraph App[应用与领域层]
        BFF[BFF 控制器]
        AdminBFF[后台 BFF]
        Orchestrator[查词编排器]
        ProfileSvc[画像与偏好服务]
        HistorySvc[历史/导出服务]
        QuotaSvc[配额与限速服务]
        FeatureFlag[特性开关服务]
        Billing[订阅与账务服务]
    end

    subgraph Infra[基础设施]
        Redis[(Redis L1/L2 缓存\n配额/限速/幂等存储)]
        RDBMS[(PostgreSQL 主存储)]
        ObjectStore[(对象存储\n导出文件/回放样本)]
        Observability[(日志/指标/追踪/告警)]
        Tasker[后台任务编排]
        Queue[(消息队列\n事件/回执分发)]
    end

    subgraph External[外部依赖]
        LLM[Doubao LLM API]
        IdP[第三方身份/支付]
        Mailer[邮件/通知服务]
    end

    Client -->|HTTPS 请求| CDN --> APIGW --> BFF
    Admin -->|RBAC 登录| CDN --> AdminGW --> AdminBFF
    BFF --> Orchestrator
    BFF --> ProfileSvc
    BFF --> HistorySvc
    BFF --> QuotaSvc
    BFF --> FeatureFlag
    BFF --> Billing
    AdminBFF --> HistorySvc
    AdminBFF --> Billing
    AdminBFF --> FeatureFlag
    Orchestrator -->|读写| Redis
    Orchestrator -->|调用| LLM
    HistorySvc --> Redis
    HistorySvc --> RDBMS
    HistorySvc --> ObjectStore
    ProfileSvc --> RDBMS
    QuotaSvc --> Redis
    FeatureFlag --> Redis
    Billing --> RDBMS
    Billing --> IdP
    BFF --> Observability
    AdminBFF --> Observability
    APIGW --> Observability
    AdminGW --> Observability
    Tasker --> HistorySvc
    Tasker --> ObjectStore
    Tasker --> RDBMS
    Tasker -.-> Queue
    Tasker --> Observability
    Queue -.-> Tasker
    BFF -.-> Queue
    Queue -.-> BFF
    BFF --> IdP
    IdP --> BFF
    Tasker -.-> Mailer
    Mailer -.-> Client
```

---

## C.2 时序图 — 查词与个性化生成

```mermaid
sequenceDiagram
    participant U as 用户客户端
    participant G as API 网关
    participant B as BFF 控制器
    participant F as 特性开关
    participant P as 画像与偏好服务
    participant Q as 配额与限速服务
    participant O as 查词编排器
    participant C as Redis L1/L2 缓存
    participant L as Doubao LLM
    participant D as 降级内容提供者
    participant H as 历史服务/RDBMS
    participant Obs as 观测平台

    U->>G: POST /lookup（词条、语言对、详略级别）
    G->>B: 透传请求（鉴权上下文 + 会话信息）
    B->>F: 读取特性开关与模块顺序
    F-->>B: 返回开关配置
    B->>P: 拉取最新画像摘要
    P-->>B: 用户画像/偏好
    B->>Q: 校验查词配额与速率
    Q-->>B: 通过 / 拒绝
    B-->>Obs: 记录请求跨度（trace/span）
    alt 配额不足
        B-->>U: 429 + 冷却时间
        B-->>Obs: 标记限流事件
    else 配额充足
        B->>O: 携带幂等键 + 开关 + 画像发起查词
        O->>C: 查询 L1/L2 缓存
        alt 缓存命中
            C-->>O: 返回个性化结果
            O-->>Obs: 记录缓存命中
        else 缓存未命中
            O->>L: 调用 Doubao LLM（模板 + 画像提示）
            alt LLM 失败
                L-->>O: 错误/超时
                O->>D: 请求降级释义
                D-->>O: 模板化基础释义
                O-->>Obs: 标记 `degraded=true`
            else LLM 成功
                L-->>O: 结构化释义
            end
            O->>C: 写入 L1/L2 缓存（含 TTL）
            O->>H: 按留存策略写历史
        end
        O-->>B: 契约 glancy.dict.v1（含 `source` 标记）
        B-->>Obs: 输出指标（成功/降级/耗时）
        B->>U: 200 + 渐进渲染模块
    end
```

---

## C.3 状态机 — 导出任务生命周期

```mermaid
stateDiagram-v2
    [*] --> Draft: 用户提交导出请求
    Draft --> Draft: 用户更新过滤条件/格式
    Draft --> Queued: 参数校验通过\n写入导出任务表
    Draft --> Failed: 参数非法/配额不足
    Draft --> Cancelled: 用户主动撤回

    Queued --> Queued: 任务排队等待\n可见于任务列表
    Queued --> Generating: 后台任务编排器拉取
    Queued --> Cancelled: 用户撤回且尚未开工

    Generating --> Generating: 临时失败重试\n<= 3 次（指数退避）
    Generating --> Completed: 导出文件生成\n写入对象存储
    Generating --> Failed: 重试超限或存储异常

    Completed --> Delivered: 生成一次性下载链接\n写入对象存储元数据
    Completed --> Failed: 写回通知或回执失败

    Delivered --> Expired: TTL 10 分钟到期
    Delivered --> Deleted: 用户主动删除
    Expired --> Deleted: 定时清理
    Failed --> Deleted: T+7 天物理清理
    Cancelled --> Deleted: 清理残留元数据
```

---

## C.4 使用说明

- **配色与图例**：Mermaid 使用默认主题，方框表示内部组件，圆角表示外部依赖或状态；虚线箭头代表事件/通知，实线箭头代表同步调用。
- **与主体章节的对应**：
  - 系统上下文图对应《第 7 章》中的层次划分，补充后台入口、账务与通知等依赖的边界。
  - 时序图重现《第 7.4.1 节》查词流程，突出特性开关、画像读取、缓存命中与降级分支，以及观测埋点。
  - 状态机图映射《第 7.4.3 节》导出任务的状态控制与清理策略，补充撤回、失败回滚与通知失败路径。
- **扩展与演进**：若后续引入多租户或更多客户端形态，可在上下文图中扩展租户隔离边界，并为关键时序补充并行泳道与事件流。
