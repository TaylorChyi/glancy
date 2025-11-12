# Changelog

所有对外可见的版本变更都会记录在本文件中。格式遵循 [Keep a Changelog 1.1.0](https://keepachangelog.com/zh-CN/1.1.0/) 并逐步对齐语义化版本（Semantic Versioning）。

## 维护约定
- `Git Tag ↔️ Release ↔️ Changelog`：每一次对外发布都必须打 Tag、发布 GitHub Release，并在此文件新增一个 `## [vX.Y.Z] - YYYY-MM-DD` 条目。
- 每条变更都以一句话总结业务影响，并在结尾追加 PR 链接，例如 `(#123)` → `[ #123 ](https://github.com/TaylorChyi/glancy/pull/123)`，确保可追溯。
- 发布说明（Release Notes）直接引用对应版本的段落，禁止出现两份不一致的描述。
- 草稿由发布流水线生成，人工仅做分类与补充备注，避免遗漏合并的 PR。

## 流程说明
1. **开发者维护**：PR 合并后立即在 `## [Unreleased]` 中补齐条目，保持信息实时。
2. **流水线草稿**：CI/CD 在发布阶段运行 `node scripts/release/changelog-draft.mjs --from <上一 Tag> --to <发布 Commit>`，生成含 PR 链接的草稿 Markdown，写回/附加到 `CHANGELOG.md`。
3. **人工复核**：版本 Owner 调整分类（Added/Changed/…），补充备注或影响面，随后将 `## [Unreleased]` 拷贝为 `## [vX.Y.Z] - YYYY-MM-DD` 并新增新的 `Unreleased` 节点。
4. **发布同步**：利用同一段 Markdown 作为 GitHub Release 描述，确保变更记录与对外发布完全一致。

## 分类约定
- `Added`：全新功能、接口或配置能力。
- `Changed`：已有能力的行为变化、体验/文档更新。
- `Deprecated`：仍可用但计划下线的能力，需要写出替代方案。
- `Removed`：已经下线或彻底移除的能力。
- `Fixed`：缺陷、回归或错误修复。
- `Security`：补丁、权限、依赖漏洞等安全相关内容。

## 模板示例
```markdown
## [vX.Y.Z] - 2024-05-01
### Added
- 支持多账号密钥轮换 ([#123](https://github.com/TaylorChyi/glancy/pull/123))

### Changed
- 调整 API-001 限流策略 ([#124](https://github.com/TaylorChyi/glancy/pull/124))

### Fixed
- 解决导出报表在 Safari 下的空白页问题 ([#125](https://github.com/TaylorChyi/glancy/pull/125))
```

---

## [Unreleased]

### Added
- _暂无。由流水线或合并 PR 后补充。_

### Changed
- _暂无。由流水线或合并 PR 后补充。_

### Deprecated
- _暂无。_

### Removed
- _暂无。_

### Fixed
- _暂无。_

### Security
- _暂无。_

## [glancy.dict.v2] - 2025-06-05

### Added
- 发布 `glancy.dict.v2` 契约 Beta，通过 `Accept` 头或 `?contract=preview` 提供双版本响应，支撑未来模块扩展与性能统计统一。([#1088](https://github.com/TaylorChyi/glancy/pull/1088))

### Changed
- 为 `glancy.dict.v2` 灰度引入 `Link`/`Sunset` 头与契约回放守护，确保 Beta 期间可安全回退。([#1090](https://github.com/TaylorChyi/glancy/pull/1090))

## [glancy.billing.v1] - 2025-01-10

### Added
- 订阅状态机新增 `PAUSED`，支持人工冻结权益并在订阅页、账单与接口中同步展示。([#1095](https://github.com/TaylorChyi/glancy/pull/1095))

### Changed
- 调整权益同步与限流护栏，保障暂停/恢复流程在 AB 灰度期间稳定运行。([#1096](https://github.com/TaylorChyi/glancy/pull/1096))

## [glancy.dict.v1] - 2024-11-15

### Added
- `modules.definitions[*].source` 字段向后兼容上线，释义卡片、导出与历史详情均可展示出处标签。([#1098](https://github.com/TaylorChyi/glancy/pull/1098))

### Changed
- 更新契约样本与 Schema Registry，指导客户端在兼容期内忽略未知字段并完善监控。([#1094](https://github.com/TaylorChyi/glancy/pull/1094))

[Unreleased]: https://github.com/TaylorChyi/glancy/compare/main...HEAD
[glancy.dict.v2]: https://github.com/TaylorChyi/glancy/releases/tag/glancy.dict.v2
[glancy.billing.v1]: https://github.com/TaylorChyi/glancy/releases/tag/glancy.billing.v1
[glancy.dict.v1]: https://github.com/TaylorChyi/glancy/releases/tag/glancy.dict.v1
