# Versioning & Branching

> 目标：统一版本号、分支与镜像 Tag 策略，使每一次发布都可追溯、可回滚，并与 `Docker.md` / `K8s.md` 的部署流程对齐。

## 1. 版本语义
1. **规范**：`v<MAJOR>.<MINOR>.<PATCH>`（SemVer）。
   - `MAJOR`：不兼容接口/协议变更，如 REST API 结构调整、数据库重大升级。
   - `MINOR`：向后兼容功能新增、配置项新增。
   - `PATCH`：缺陷修复、安全补丁、文案等微调。
2. **派生标记**：
   - 预发布：`v1.4.0-rc.1`，用于 `staging` 演练。
   - Build 元信息：CI 自动写入 `git.commit.id` 和 `build.time` 到 `/actuator/info`。
3. **来源**：`VERSION` 文件由 Release 管理员维护（可在 CI 中根据 tag 写入），前端/后端构建脚本均读取该值注入环境变量 `SERVICE_VERSION`。

## 2. 分支命名
| 分支 | 说明 | 命名 | 合并策略 |
| --- | --- | --- | --- |
| `main` | 永远可发布，代表线上状态 | 固定 | 只接受来自 `release/*` 或 `hotfix/*` 的 PR，必须通过代码审查与 CI。 |
| `develop` | 集成分支，供 QA/Dev 环境使用 | 固定 | Feature 合并前需要通过 `mvn test`、`npm test`、`npm run lint`。 |
| `feature/*` | 功能/需求开发 | `feature/<jira-id>-<slug>` | 完成后合并到 `develop`，禁止直接推到 `main`。 |
| `release/*` | 发版准备 | `release/v<MAJOR>.<MINOR>.0` | 从 `develop` 切出，冻结新功能，仅允许修复 bug；验收完合并到 `main` 与 `develop`。 |
| `hotfix/*` | 线上紧急修复 | `hotfix/v<MAJOR>.<MINOR>.<PATCH>` | 直接从 `main` 切分支，修复后回合 `main` + `develop`，并立即打 tag。

## 3. 发布流程
1. **Cut Release Branch**：`git checkout -b release/v1.4.0 develop`。
2. **版本对齐**：
   - 更新 `VERSION`、以及用于 UI 展示版本号的常量/配置。
   - 在 `doc/CHANGELOG.md` 或等效文件记录变化（若不存在可新建）。
   - 确认 `doc/deploy/Envs.md` 中的变量如需新增已补充。
3. **质量闸门**：
   - `./mvnw verify`
   - `npm run lint && npm test && npm run build`
   - `npm run test:e2e`（可在 `staging` 执行）
4. **打 Tag**：在 release branch 通过验收后：
   ```bash
   git checkout main
   git merge --ff-only release/v1.4.0
   git tag -a v1.4.0 -m "Release v1.4.0"
   git push origin main --follow-tags
   git checkout develop
   git merge --ff-only release/v1.4.0
   ```
5. **CI 产物**：Tag 推送后流水线执行：
   - 构建 Backend Jar + Docker 镜像 `registry.../backend:v1.4.0`
   - 构建 Website 静态资源 + 镜像 `registry.../website:v1.4.0`
   - 生成 SBOM、安全扫描报告（如 `mvn org.owasp:dependency-check-maven:aggregate`）
6. **发布单**：
   - 记录版本号、Git 提交、镜像 digest、涉及的环境变量调整。
   - 链接到 `doc/deploy/Docker.md`/`K8s.md` 中的部署步骤，确保操作员使用相同 tag。

## 4. 变更与回滚
1. **回滚策略**：
   - Git：`git revert -m 1 <merge-commit>` 创建回滚 PR。
   - 镜像：部署流水线可选 `Previous Artifact`（上一 tag）。
2. **热修复**：
   - 从 `main` 切 `hotfix/v1.4.1`，完成修改后重复第 3 节 Tag 流程。
   - 热修复发布完成后，记得同步 `hotfix` 变更回 `develop`，防止丢失。
3. **版本冻结**：
   - 在 `release/*` 上设置 `CODEFREEZE=true` 标记，CI 将阻断来自 `feature/*` 的自动合并，确保只接受 bugfix。

## 5. 与部署策略的映射
1. **Docker**：镜像 tag = Git tag = `VERSION`。在 `doc/deploy/Docker.md` 中的蓝绿/滚更操作均以该 tag 为输入。禁止使用 `latest` 在 `staging/prod` 发布。
2. **K8s**：`Deployment` 的 `image` 字段必须引用具体版本；`kubectl rollout undo` 依赖 `image` 历史，若 tag 不变则无法回滚。
3. **配置版本**：Secrets/ConfigMap 建议追加 `dataVersion` 字段，格式与代码版本一致，例如 `dataVersion: v1.4.0`，以便排查“代码已升级但配置未更新”的情形。
4. **文档同步**：任何涉及部署的信息变更，需要同步更新：`doc/deploy/Envs.md`（变量）、`Docker.md`（镜像/脚本）、`K8s.md`（探针/资源）。发布单应链接到对应 MR/PR 以及文档 diff。

通过上述策略，可以将 Git、镜像、配置与发布流程串联起来，保证“能跑一次”的环境可以被可靠复制、快速回滚，并且版本号与变更记录保持一致。
