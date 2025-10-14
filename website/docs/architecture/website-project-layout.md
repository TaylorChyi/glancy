# website 顶层目录分层说明

## 目标
- 收敛零散配置文件，统一落在 `config/` 目录便于跨工具复用；
- 将运行与运维脚本归档至 `ops/`，隔离业务源码与工程脚手架；
- 将测试资产统一置于 `tests/`，明确 mocks、端到端脚本的归属。

## 目录概览
- `config/`
  - `build/`：Vite、PostCSS、Tailwind 等构建链配置，依赖共享别名。
  - `quality/`：ESLint、Stylelint 等质量门禁配置。
  - `runtime/`：Babel 等运行时编译配置。
  - `test/`：Jest 与 Playwright 配置，与 `tests/` 目录联动。
  - `types/`：TypeScript 基础选项与路径别名。
  - `shared/`：路径解析与别名工具，供上述配置复用。
- `ops/`
  - `scripts/`：构建前后的 Node CLI，使用 `PATHS` 解析资源路径。
  - `tools/`：图标处理等工程化工具。
  - `server/`：本地预览服务与其配置。
- `tests/`
  - `mocks/`：Jest 运行所需的模块模拟。
  - `e2e/`：Playwright 端到端测试脚本。

## 协作约定
- 所有跨目录路径请通过 `config/shared/projectPaths.js` 暴露的 `PATHS` 获取；
- 新增脚本需在 `ops/` 下分类，并在 `package.json` 中以该路径调用；
- 若需新增配置文件，请先判断所属层级（build/quality/test/types/runtime）。

## 演进建议
- 引入 `ops/automation` 子目录，沉淀 CI/CD 专用脚本；
- 为 `tests/` 增设 `integration/`、`contract/` 等子层，支持更细粒度测试分类。
