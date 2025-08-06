# 仓库协作说明

## 分支管理
- 新建特性分支时，请以 `feature-<英文描述>` 命名。
- 任务名称和提交说明请使用中文，保持简洁。

## 开发流程
1. 运行 `npm ci` 安装依赖。
2. 修改代码后执行 `npm run lint` 保证代码风格一致。
3. 通过 `npm run build` 确认项目可以正常构建。

## 忽略文件
- `dist` 和 `node_modules` 目录已在 `.gitignore` 中排除，请勿提交。

## Pull Request 格式
提交 PR 时请统一使用英文描述，并遵循以下约定：

- PR 标题应以 `[type] message` 格式书写，其中 `type` 取值 `fix`、`feature`、`refactor` 等，用以标识变更类别；例如 `[fix] resolve build error`。
- 合并描述请严格按照下述模板填写：

```
### Summary
- Briefly describe what was changed in one or two bullet points.

### Testing
- List the commands you executed and mark the result with `✅` or `❌`.

### Notes
- Provide any additional context if necessary, otherwise omit this section.
```

完成更改并通过上述检查后再提交代码。
