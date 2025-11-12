# 版本控制策略（Version Control Policy）

## 0. 范围与目标
- 所有代码库统一遵循同一套分支、提交、Tag 与发布流程，保证任何改动都能追溯到发布版本与 Release Notes。
- 采用 Trunk-Based Development（`main` 为唯一长期可发布分支）+ 短期 `release/*` 封板，兼顾快速迭代与稳定发布。
- 所有 PR 由 CI 自动执行构建、测试、静态检查与提交格式校验，未通过前禁止合并。
- Conventional Commits 结构与 22.12.3《Release Notes 模板》对齐，支持自动生成变更日志、版本号与发布工单。

---

## 1. 分支模型：Trunk + Release 短期封板

### 1.1 长期分支

| 分支 | 说明 | 权限 |
| --- | --- | --- |
| `main` | 可随时部署到生产；所有合规的 PR 通过 Squash Merge 进入，始终保持可发布状态。 | 受保护：禁止直接 push，需 PR + 2 名 reviewer 同意。 |
| `release/<yyww>` | 从 `main` 切出，锁定当周/双周发布范围，仅允许补充回归阻断问题。发布完成后合并回 `main` 并删除。 | Release Captain 维护；合并策略同 `main`。 |

### 1.2 工作分支（短期存续 ≤ 5 天）

| 前缀 | 示例 | 来源 & 合并目标 | 规则 |
| --- | --- | --- | --- |
| `feature/<issue-id>-<slug>` | `feature/GL-312-add-audit` | 从 `main` 切出；完成后发 PR → `main` | 单一需求；保持与 `main` 每日同步，避免长时间漂移。 |
| `fix/<bug-id>-<slug>` | `fix/BUG-982-null` | `main` | 面向 Blocker 的修复；可直接进入当前 `release/*` 分支并反向合并 `main`。 |
| `hotfix/<severity>-<slug>` | `hotfix/P1-revert-auth` | 从已打 Tag 的版本切出 | 仅针对线上事故；完成后：`hotfix` → `main` → 新 Tag → 回灌最新 `release/*`。 |
| `chore/<scope>` | `chore/deps-bump` | `main` | Build/依赖调整；可合并多个低风险变更。 |

### 1.3 生命周期
1. 产品或技术需求在工单系统立项（含 `issue-id`），负责人从 `main` 切出对应分支。
2. 开发期间保持分支干净：禁止合并其他功能、避免压缩/重写他人历史。
3. 通过 PR 发起合并，CI 成功并通过评审后以 Squash Merge 方式进入 `main`。
4. 预发布窗口开启时，由 Release Captain 从 `main` 切 `release/<yyww>`：  
   - 冻结新增功能 PR，只允许针对 `release/*` 的 `fix/*`；  
   - 回归通过后创建 Tag 并交付至生产。  
5. 发布后删除 `release/*`，确保 `main` 是唯一长期历史；必要时将 `release/*` 中的更改回灌 `main`。

---

## 2. PR 合并策略与代码评审
- **PR 内容**：关联工单 ID、变更说明、风险与回滚方案，附加必要截图或日志。
- **CI 阶段门禁**：`lint`（含 commitlint）、`build`, `test`, `security` 必须全绿；`required` 状态失败会阻止合并。
- **评审要求**：至少 2 名 Reviewer，其中一名需来自模块 Owner；Reviewer 负责检查设计一致性、测试覆盖与安全影响。
- **合并策略**：`feature/*`/`chore/*` 采用 Squash Merge，生成单条 Conventional Commit；`hotfix/*` 可使用 Rebase Merge 维持时间线。
- **反向同步**：`release/*` 合并到 `main` 后立即删除，避免漂移；若 `hotfix` 直接从 Tag 分叉，发布后必须回灌 `main` 和活跃 `release/*`。

---

## 3. 提交规范（Conventional Commits）

### 3.1 基本格式
```
<type>(<scope>): <subject>

[body]

[footer(s)]
```
- `type`：`feat` | `fix` | `refactor` | `perf` | `docs` | `style` | `test` | `build` | `ci` | `chore` | `revert`
- `scope` 可选，建议使用模块名或服务名（例如 `web`, `api`, `infra`）。
- `subject` 以内联英文动词描述，≤ 72 字符。
- `body` 用于说明动机、风险或实现细节。
- `footer`：`BREAKING CHANGE: ...` 描述不兼容变更；`Refs: GL-123` 关联工单；`Co-authored-by` 支持协作。

### 3.2 CI 校验
- `commitlint`（或同等工具）在 `pre-commit` 与 `lint` pipeline 中强制校验格式。
- `branch-name` 检查器验证是否匹配上节约定的前缀与工单 ID。
- 不合规提交禁止推送至远端；如需例外，必须通过 `hotfix` + Release Captain 审批，并在 Release Notes 中注明偏差原因。

---

## 4. Tag 规则与发布分支
- **命名**：遵循 SemVer，格式 `v<MAJOR>.<MINOR>.<PATCH>`，例如 `v2.3.0`。候选版本使用 `-rc.<n>`（如 `v2.3.0-rc.1`）。
- **来源**：仅可在 `release/*` 或 `hotfix/*` 合并回 `main` 并完成验证后打 Tag，禁止对未通过 CI 的提交打 Tag。
- **签名**：Tag 使用团队 GPG 密钥签名（`git tag -s`），确保可追溯性。
- **发布分支**：一个 `release/<yyww>` 只对应一个 GA Tag；灰度/多阶段可在同一分支上依次生成 `-rc` Tag，并在 `doc/需求说明文档/第 21 章 发布计划与灰度策略.md` 中登记批次。
- **热修复**：从最后一个 GA Tag 切 `hotfix/*`，修复后生成 `v<MAJOR>.<MINOR>.<PATCH+1>`，并按事故流程更新 Release Notes。

---

## 5. 与 CI/CD & Release Notes 的对齐
- **版本追踪**：CI 将 `main` 上的每个合规提交与对应 Tag 写入制品版本（镜像标签、SBOM 与部署工单），以确保“任一改动能定位到发布版本”。
- **自动校验提交格式**：`lint` pipeline 运行 `commitlint --config commitlint.config.js`，并在 PR 状态检查中作为必需项；违反规范的 PR 无法合并，满足验收标准 2。
- **Release Notes 生成**：`release` workflow 根据 Conventional Commits 分类（`feat/fix/chore/...`）生成 22.12.3 模板所需字段（Breaking Change、Deprecation、依赖更新等），并链接版本 Tag 与 `issue-id`，确保与变更记录一致。
- **CI/CD 部署控制**：仅允许带有效 Tag 的构建进入 `staging`/`prod` 环境；`hotfix` Tag 会触发相同流水线但使用事故模板。
- **回溯链路**：Release Notes 中引用的工单、Tag、`release/<yyww>` 分支名与 PR URL 保持一致，可通过任意一个维度追溯到具体代码提交。

---

## 6. 角色与职责
- **Release Captain**：维护 `release/*` 生命周期，审核 `hotfix`，触发 Tag 与灰度计划。
- **Module Owner**：负责所属模块 PR 的技术评审与测试验证，确认影响面与回滚策略。
- **CI Maintainer**：维护 commit 校验、branch 规则、Tag 保护与自动化脚本，确保策略持续生效。
- **开发者**：遵循分支与提交规范，保证 PR 信息完整、测试通过，并在 Release Notes 中准确描述变更。

> 通过以上策略，满足「改动可定位到发布版本」「CI 自动校验提交格式」与「与变更记录一致」三项验收标准，同时支撑快速迭代与可控发布。
