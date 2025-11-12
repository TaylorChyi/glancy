# 版本控制策略（Version Control Policy）

## 0. 目标与适用范围
- 所有代码库统一遵循同一套分支、提交、Tag 与发布流程，保证任何改动都能追溯到发布版本、CI 制品与 Release Notes。
- 采用 Trunk-Based Development：`main` 为唯一长期可发布分支，辅以短期 `release/*` 分支封板，兼顾快速迭代与稳定交付。
- 所有 PR 必须通过 CI 的构建、测试、静态检查与提交格式校验后方可合并，确保质量门禁与审计可追溯。
- 提交信息遵循 Conventional Commits，字段映射 22.12.3《Release Notes 模板》，便于自动生成版本日志与发布工单。

---

## 1. 分支模型：Trunk + Release 封板

### 1.1 长期分支

| 分支 | 说明 | 权限 |
| --- | --- | --- |
| `main` | 始终保持可发布状态；所有合规 PR 以 Squash Merge 合入，保证线性历史。 | 受保护：禁止直接 push，需 PR + 2 名 reviewer 审批。 |
| `release/<yyww>` | 从 `main` 切出，锁定周/双周发布范围，仅允许回归阻断修复。发布完成后合并回 `main` 并删除。 | 由 Release Captain 管理；合并策略与 `main` 一致。 |

### 1.2 工作分支（生命周期 ≤ 5 天）

| 前缀 | 示例 | 来源与目标 | 规则 |
| --- | --- | --- | --- |
| `feature/<issue-id>-<slug>` | `feature/GL-312-add-audit` | `main` → `main` | 对应单一需求；每日与 `main` 同步，避免长期漂移。 |
| `fix/<bug-id>-<slug>` | `fix/BUG-982-null` | `main` → `main` 或 `release/*` | 面向回归阻断；允许先修复到当前 `release/*`，再回灌 `main`。 |
| `hotfix/<severity>-<slug>` | `hotfix/P1-revert-auth` | `tag` → `main` | 线上事故处理：`hotfix` → `main` → 打新 Tag → 回灌活跃 `release/*`。 |
| `chore/<scope>` | `chore/deps-bump` | `main` → `main` | 构建/依赖/运维变更，可合并多个低风险调整。 |

### 1.3 生命周期
1. 需求在工单系统立项（含 `issue-id`），负责人从 `main` 切出对应工作分支。
2. 开发期间保持分支干净：禁止引入无关功能、避免重写他人历史。
3. 工作完成后发起 PR，CI 全绿并通过评审后以 Squash Merge 合入 `main`。
4. 预发布窗口开启时，Release Captain 从 `main` 切出 `release/<yyww>`：
   - 冻结新增功能 PR，仅允许针对 `release/*` 的阻断修复；
   - 回归通过后创建 Tag 并交付生产。
5. 发布结束后删除 `release/*`，并将其中的变更回灌 `main`，保持单一真实来源。

---

## 2. PR 合并策略与代码评审
- **PR 内容**：必须关联工单 ID，说明变更目的、风险、测试/回滚方案，并补充必要截图或日志。
- **CI 门禁**：`lint`（含 commitlint）、`build`、`test`、`security` 均为必选检查，任何必选项失败禁止合并。
- **评审要求**：至少 2 名 Reviewer，其中一名必须是模块 Owner；Reviewer 负责评估设计一致性、测试覆盖与安全影响。
- **合并策略**：`feature/*`、`fix/*`、`chore/*` 采用 Squash Merge，生成单条 Conventional Commit；`hotfix/*` 在需要保留原始时间线时可使用 Rebase Merge。
- **反向同步**：`release/*` 合并回 `main` 后立即删除；若 `hotfix` 从 Tag 分叉，发布后必须回灌 `main` 以及仍在测试的 `release/*`。

---

## 3. 提交规范（Conventional Commits）

### 3.1 基本格式
```
<type>(<scope>): <subject>

[body]

[footer(s)]
```
- `type`：`feat`｜`fix`｜`refactor`｜`perf`｜`docs`｜`style`｜`test`｜`build`｜`ci`｜`chore`｜`revert`。
- `scope` 可选，建议使用模块名或服务名（如 `web`、`api`、`infra`）。
- `subject` 以内联英文动词描述，长度 ≤ 72 字符。
- `body` 用于记录动机、实现细节、风险或测试说明。
- `footer` 包含 `BREAKING CHANGE: ...` 描述不兼容调整，`Refs: GL-123` 关联工单，以及 `Co-authored-by` 等协作信息。

### 3.2 CI 校验
- `commitlint`（或等效工具）在本地 `pre-commit` 与 CI `lint` pipeline 中强制校验提交格式。
- 分支命名检查器验证是否匹配第 1 节约定的前缀与工单 ID。
- 不合规提交禁止推送远端；如需例外，必须通过 `hotfix` 流程由 Release Captain 审批，并在 Release Notes 中登记原因。

---

## 4. Tag 规则与发布分支
- **命名**：遵循 SemVer，格式 `v<MAJOR>.<MINOR>.<PATCH>`，候选版本使用 `-rc.<n>`，如 `v2.3.0-rc.1`。
- **来源**：仅在 `release/*` 或 `hotfix/*` 合入 `main` 并通过验证后打 Tag；禁止对未通过 CI 的提交打 Tag。
- **签名**：Tag 使用团队 GPG 密钥签名（`git tag -s`），确保可追溯性与防篡改。
- **发布分支**：同一 `release/<yyww>` 仅对应一个 GA Tag；若存在灰度/多阶段发布，可在该分支上依次生成 `-rc` Tag，并在《需求说明文档/第 21 章 发布计划与灰度策略.md》中登记批次。
- **热修复**：从最新 GA Tag 切 `hotfix/*`，修复完成后生成 `v<MAJOR>.<MINOR>.<PATCH+1>`，并依据事故流程更新 Release Notes。

---

## 5. 与 CI/CD & Release Notes 的对齐
- **版本追踪**：CI 在构建产物（镜像、SBOM、部署工单）中写入源提交 SHA 与 Tag，确保任一改动都可映射至发布版本。
- **提交格式校验**：`lint` pipeline 执行 `commitlint --config commitlint.config.js` 与分支命名脚本，校验结果作为必选 PR 检查项，满足验收标准 2。
- **Release Notes 生成**：`release` workflow 读取 Squash 后的 Conventional Commit，按 `feat/fix/chore/...` 分类映射 22.12.3 模板字段（Breaking Change、Deprecation、依赖更新等），并关联 Tag、工单与 PR URL，确保与变更记录一致。
- **CI/CD 部署控制**：仅允许带有效 GA/RC Tag 的构建进入 `staging` 或 `prod` 环境；`hotfix` Tag 触发相同流水线但使用事故发布模板。
- **回溯链路**：Release Notes 中保存工单号、Tag、`release/<yyww>` 分支名与 PR 链接，可通过任意维度追溯到具体提交，满足验收标准 1 与 3。

---

## 6. 角色与职责
- **Release Captain**：维护 `release/*` 生命周期，审批 `hotfix`，触发 Tag 与灰度计划，确保发布窗口受控。
- **Module Owner**：负责所属模块 PR 的技术评审与测试验证，确认影响面与回滚策略。
- **CI Maintainer**：维护 commit 校验、分支保护、Tag 策略与自动化脚本，保证策略持续有效。
- **开发者**：遵循分支、提交、评审规范，补充完整的 PR/Release Notes 信息，并配合回溯与审计需求。

> 通过上述策略，实现「任一改动可定位到发布版本」「CI 自动校验提交格式」与「与变更记录一致」三项验收标准，同时支撑团队的快速迭代与可控发布。
