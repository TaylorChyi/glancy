# Instructions for backend contributors

<!-- test -->

- 在提交位于本目录的任何代码更改之前，必须运行 `mvn spotless:apply` 来保持代码风格一致。
- 如果命令失败，请修复相关问题后再尝试，以确保提交前的代码符合项目规范。
- 禁止在业务代码中出现“魔法值”等硬编码。请将可配置参数抽取至 `application.yml` 或常量类中管理，例如将状态码、限流阈值等集中维护，避免散落在各处。
- 单元测试方法的函数头注释必须清晰描述测试逻辑与执行流程，确保读者无需阅读实现即可理解测试目的与步骤。
- 在需要时优先采用合适的设计模式，以提升代码的可维护性与可扩展性，践行“童子军军规”让代码质量持续提升。
- 质量门槛：函数 ≤ 30 行（构造器/覆盖 ≤ 40 行），单文件 ≤ 250 行，外部 API 参数 ≤ 5、内部方法参数 ≤ 6，单行 ≤ 120 字符。Jacoco 行覆盖 ≥ 70%、分支覆盖 ≥ 60%，违反将导致 `mvn verify` 失败。

## 集成测试补充流程

- 当引入新的服务编排或跨组件交互时，应在 `backend/src/test/java` 下创建对应的 `@SpringBootTest` 集成测试类，类级注释需描述业务场景、预期结果与关键依赖。必要时借助 `@AutoConfigureMockMvc`、`TestRestTemplate` 等测试工具模拟外部交互。
- 复用或构建测试夹具时优先通过 Spring 上下文注入真实 Bean，外部依赖使用可替换的接口桩或 Testcontainers，确保覆盖真实的 IoC 与序列化路径。
- 集成测试完成后运行 `mvn test -Dtest=*IT` 或针对性测试命令验证端到端行为，再执行 `mvn spotless:apply` 统一代码风格。

## 格式化命令

- 在仓库根目录执行 `mvn spotless:apply`。确认 `src/main` 与 `src/test` 的 Java 与 Kotlin 代码合规，命令失败时先修复再提交。
