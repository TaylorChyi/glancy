# Repository Guidelines

This project is a Spring Boot backend. Contributors should follow these rules:

## General
- Use 4 spaces for indentation in Java and YAML files.
- Keep lines under 120 characters where possible.
- Do not remove existing Lombok annotations.

## Testing
- Run `./mvnw test` before every commit. Ensure tests pass when possible.
- If the Maven wrapper fails due to environment issues, state this in the PR.

## Pull Requests
- **All PR titles and bodies must be written in English.**
- Begin every PR title with a tag in square brackets indicating the type of change.
  Common tags include `[Fix]`, `[Feature]`, `[Refactor]`, and `[Docs]`.
  Example: `[Fix] Correct login bug`.
- Start the body with a `## Summary` section listing the main changes and referencing any key files.
- Follow this with a `## Testing` section showing the `./mvnw test` output, or explain why tests could not run.
- Optionally include a `## Notes` section for any extra context.

Use this template to keep every pull request consistent:

```markdown
## Summary
- explain the purpose of the change

## Testing
- `./mvnw test`

## Notes
- any optional remarks
```

## API Development
- 每新增一个 API，都必须编写相应的单元测试。
- 更新 `scripts/curl-tests.sh` 等脚本，以便通过 curl 对新接口进行验证。
- 提交信息建议使用中文描述；如需创建分支，feature 名称应使用英文。

