# 附录 C 图示（系统上下文、时序、状态机）

> 本附录采用 Mermaid 图示补充主体章节的叙述，帮助快速理解 Glancy 词汇助手的核心交互、边界与状态流转。除非另有说明，图中组件命名与《第 7 章 系统架构与组件》保持一致。

---

## C.1 系统上下文图

```mermaid
flowchart TB
    subgraph User[终端用户]
        Client[Web/H5 客户端]
    end

    subgraph Edge[边缘与接入层]
        CDN[CDN / WAF]
        APIGW[API 网关]
    end

    subgraph App[应用与领域层]
        BFF[BFF 控制器]
        Orchestrator[查词编排器]
        ProfileSvc[画像与偏好服务]
        HistorySvc[历史/导出服务]
        QuotaSvc[配额与限速服务]
        FeatureFlag[特性开关]
    end

    subgraph Infra[基础设施]
        Redis[(Redis L1/L2 缓存\n配额与幂等存储)]
        RDBMS[(RDBMS 主存储)]
        ObjectStore[(对象存储\n导出文件/回放样本)]
        Observability[(日志/指标/追踪)]
        Tasker[后台任务编排]
    end

    subgraph External[外部依赖]
        LLM[Doubao LLM API]
        IdP[第三方身份/支付]
    end

    Client -->|HTTPS 请求| CDN --> APIGW --> BFF
    BFF --> Orchestrator
    BFF --> ProfileSvc
    BFF --> HistorySvc
    BFF --> QuotaSvc
    BFF --> FeatureFlag
    Orchestrator -->|读写| Redis
    Orchestrator -->|调用| LLM
    HistorySvc --> Redis
    HistorySvc --> RDBMS
    HistorySvc --> ObjectStore
    ProfileSvc --> RDBMS
    QuotaSvc --> Redis
    FeatureFlag --> Redis
    BFF --> Observability
    APIGW --> Observability
    Tasker --> HistorySvc
    Tasker --> ObjectStore
    Tasker --> RDBMS
    Tasker --> Observability
    BFF --> IdP
    IdP --> BFF
```

---

## C.2 时序图 — 查词与个性化生成

```mermaid
sequenceDiagram
    participant U as 用户客户端
    participant G as API 网关
    participant B as BFF 控制器
    participant Q as 配额与限速服务
    participant O as 查词编排器
    participant C as Redis L1/L2 缓存
    participant L as Doubao LLM
    participant H as 历史服务/RDBMS

    U->>G: POST /lookup
    G->>B: 透传请求（含鉴权上下文）
    B->>Q: 校验配额与速率
    Q-->>B: 通过 / 拒绝
    alt 配额不足
        B-->>U: 429 + 冷却时间
    else 配额充足
        B->>O: 生成幂等键，发起查词
        O->>C: 查询 L1/L2 缓存
        alt 缓存命中
            C-->>O: 返回个性化结果
        else 缓存未命中
            O->>L: 调用 Doubao LLM（含画像提示）
            L-->>O: 结构化释义
            O->>C: 写入 L1/L2 缓存
            O->>H: 按留存策略写历史
        end
        O-->>B: 标准契约 glancy.dict.v1
        B->>U: 200 + 渐进渲染模块
    end
```

---

## C.3 状态机 — 导出任务生命周期

```mermaid
stateDiagram-v2
    [*] --> Draft: 用户提交导出请求
    Draft --> Queued: 参数校验通过\n写入导出任务表
    Draft --> Failed: 参数非法/配额不足

    Queued --> Generating: 后台任务编排器拉取
    Generating --> Generating: LLM 降级或暂时失败\n重试 <= 3 次
    Generating --> Completed: 导出文件生成\n写入对象存储
    Generating --> Failed: 重试超限或存储异常

    Completed --> Delivered: 一次性下载链接生成\n通知客户端
    Delivered --> Expired: TTL 10 分钟到期
    Delivered --> Deleted: 用户主动删除
    Expired --> Deleted: 定时清理
    Failed --> Deleted: T+7 天物理清理
```

---

## C.4 使用说明

- **配色与图例**：Mermaid 使用默认主题，方框表示内部组件，圆角表示外部依赖或状态。必要时通过注释说明边界。 
- **与主体章节的对应**：
  - 系统上下文图对应《第 7 章》中的层次划分，补充各层交互方向。
  - 时序图重现《第 7.4.1 节》查词流程，突出缓存命中与降级分支。
  - 状态机图映射《第 7.4.3 节》导出任务的状态控制与清理策略。
- **扩展与演进**：若后续引入多租户或更多客户端形态，可在上下文图中扩展外部方框，并为关键时序补充并行泳道。
