# Versioning & Branching

> 目标：统一版本号、分支命名与镜像标签策略，让发布流程与变更记录保持一致，可快速回滚。

## 1. 版本规范
1. **SemVer**：采用 `v<MAJOR>.<MINOR>.<PATCH>`。
   - `MAJOR`：接口不兼容、数据库结构重大调整。
   - `MINOR`：向后兼容的新功能、配置项新增。
   - `PATCH`：缺陷修复、安全补丁、文案微调。
2. **预发布/补丁**：
   - 预发布使用 `vX.Y.Z-rc.N`，仅在 `staging` 环境部署。
   - 热修复可直接打 `vX.Y.Z` tag 并在 `hotfix/*` 分支完成。
3. **构建元信息**：CI 在构建时写入 `SERVICE_VERSION`、`org.opencontainers.image.revision`、`git.commit.id`，便于 `/actuator/info` 与监控系统展示。
4. **配置版本**：ConfigMap/Secret 建议增加 `dataVersion` 字段，与代码版本保持一致以避免“代码升级但配置未更新”。

## 2. 分支策略
| 分支 | 说明 | 命名示例 | 合并策略 |
| --- | --- | --- | --- |
| `main` | 永远可发布，反映线上状态 | 固定 | 只接受来自 `release/*` 或 `hotfix/*` 的 PR，要求 CI 全绿 + 两人 review。 |
| `develop` | 集成分支，供 `dev`/`staging` 使用 | 固定 | `feature/*` 合并前必须通过 `./mvnw test`、`npm run lint`、`npm test`。 |
| `feature/*` | 功能开发 | `feature/GLC-123-share-dialog` | 完成后合并回 `develop`，禁止直接合入 `main`。 |
| `release/*` | 发版准备 | `release/v1.4.0` | 从 `develop` 切出，冻结新功能，仅接受 bugfix；验收完成后合并到 `main` 与 `develop`。 |
| `hotfix/*` | 线上紧急修复 | `hotfix/v1.4.1` | 从 `main` 切分支，修复后同时合并回 `main` 和 `develop`，并立即打 tag。 |

## 3. 发布流程
1. **切分支**：`git checkout -b release/v1.4.0 develop`。
2. **版本对齐**：
   - 更新根目录 `VERSION` 与用于 UI 显示的常量。
   - 在 `CHANGELOG.md`（或等效文档）记录变更摘要。
   - 如有新增环境变量，同步更新 `doc/deploy/Envs.md`。
3. **质量闸门**：
   - Backend：`./mvnw verify`
   - Frontend：`npm run lint && npm test && npm run build`
   - 可选：`npm run test:e2e` 在 `staging` 执行
4. **打 Tag**：验收通过后执行：
   ```bash
   git checkout main
   git merge --ff-only release/v1.4.0
   git tag -a v1.4.0 -m "Release v1.4.0"
   git push origin main --follow-tags
   git checkout develop
   git merge --ff-only release/v1.4.0
   git push origin develop
   ```
5. **CI 产物**：
   - 构建 Backend Jar + Docker 镜像 `registry.glancy.xyz/glancy/backend:v1.4.0`
   - 构建 Website 静态资源 + 镜像 `registry.glancy.xyz/glancy/website:v1.4.0`
   - 生成 SBOM、安全扫描报告（如 `mvn org.owasp:dependency-check-maven:aggregate`）
6. **发布单**：记录 Git 提交、镜像 digest、配置变更、回滚策略，并链接至 `Docker.md`/`K8s.md` 的对应步骤。

## 4. 回滚与热修复
1. **Git 回滚**：`git revert -m 1 <merge-commit>` 创建回滚 PR；必要时在 `release/*` 或 `hotfix/*` 上重打 tag。
2. **镜像回滚**：部署流水线提供“上一版本”选项，或手动指定 `vX.Y.(Z-1)` tag 并执行 `kubectl rollout undo`/`docker compose up --force-recreate`。
3. **热修复流程**：
   - 从 `main` 切 `hotfix/v1.4.1`，修复后重复第 3 节打 tag 流程。
   - 发布完成后立刻将 `hotfix` 分支合并回 `develop`，保持分支一致性。
4. **冻结策略**：在 `release/*` 设置流水线变量 `CODEFREEZE=true`，阻止自动合并，确保只接受审核后的修复。

## 5. 与部署策略的映射
1. **Docker**：镜像 tag = Git tag = `VERSION`。`Docker.md` 中的发布/回滚命令需使用同一 tag，禁止在生产环境使用 `latest`。
2. **K8s**：`Deployment` 的 `image` 字段必须引用具体版本；只有 tag 发生变化，`kubectl rollout undo` 才能准确定位历史版本。
3. **配置同步**：Secrets/ConfigMap 的 `dataVersion` 更新后，需要在发布单中记录并在 `staging` 验证，通过后再同步 `prod`。
4. **文档更新**：任何涉及部署的信息变更，需同步修改 `doc/deploy/Envs.md`、`Docker.md`、`K8s.md` 并在 PR 描述中引用，以保证运维手册与实际状态一致。

遵循以上规范即可将版本控制、镜像发布与部署策略串联起来，实现“可复制、可回滚”的发版体系。
