# backend service 层编码约定

> 本说明仅约束 `backend/src/main/java/com/glancy/backend/service` 目录及其子树，补充顶层规范而不与之冲突。

- **职责划分**
  - 服务类应保持应用服务角色：编排实体、仓储与外部网关，禁止在此层撰写持久化细节或视图装配。
  - 复杂领域算法或跨聚合逻辑请拆分到 `domain` 或 `util` 包的专用组件后再注入使用，确保服务层聚焦于流程编排。
- **命名与结构**
  - 对外暴露的服务使用 `XxxService` 命名并加上 `@Service` 注解。若存在多实现，请保留接口 `XxxService`，并提供实现 `DefaultXxxService` 或 `RemoteXxxService`，再通过 Spring 配置选择实例。
  - 将基础设施适配器置于同级 `impl` 子包或其子层级；跨模块协作需通过接口与 DTO 交互，禁止直接依赖实体类集合。
  - 为协作子域建立子目录（例如 `tts`），目录内应包含局部的 `README` 或文档性测试解释上下文。
- **模式与实践**
  - 使用构造器注入依赖，并保持字段 `final`；对可选依赖使用包装类型或专用配置对象，避免在方法内部直接访问 `ApplicationContext`。
  - 事务边界由服务层声明，默认使用方法级 `@Transactional`；跨服务调用需评估传播属性，并在设计文档或提交说明中记录原因。
  - 日志采用 `Slf4j`，格式统一为结构化占位符（`log.info("Sync user {}", userId);`），严禁字符串拼接。
- **质量检查**
  - 新增或修改服务时需补充针对关键流程的单元与集成测试，并通过测试命名或断言信息呈现测试意图。
  - 提交前除了遵循仓库根目录的 `mvn spotless:apply` 要求，还需运行与服务逻辑相关的测试套件（例如 `mvn test -Dtest=*ServiceTest`），确保契约稳定。
