/**
 * 背景：
 *  - Jest 配置需要引用统一别名与新的 tests 目录，原地维护易与其它工具偏离。
 * 目的：
 *  - 集中 Jest 配置，复用路径别名与测试资源位置。
 * 关键决策与取舍：
 *  - 继续依赖 babel-jest 处理 TS/JSX，确保现有测试稳定；
 *  - 将 mocks 目录迁移至 tests/mocks，并在此处统一映射。
 * 影响范围：
 *  - 所有单元测试与快照执行。
 * 演进与TODO：
 *  - 可在此按需拆分 Node/DOM 环境配置。
 */
import path from "node:path";
import { MODULE_ALIASES, PATHS } from "../shared/projectPaths.js";

const normalise = (value) => value.split(path.sep).join("/");
const mocksDir = normalise(path.join(PATHS.tests, "mocks"));
const mapAlias = (aliasKey) => `${normalise(MODULE_ALIASES[aliasKey])}/$1`;

export default {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@shared/api/index.js$": `${mocksDir}/apiIndexMock.cjs`,
    "^@assets/(.*)\\.svg\\?raw$": `${mocksDir}/rawSvgMock.cjs`,
    "^@assets/(.*)\\.svg$": `${mocksDir}/fileMock.cjs`,
    "^@app/(.*)$": mapAlias("@app"),
    "^@core/(.*)$": mapAlias("@core"),
    "^@shared/(.*)$": mapAlias("@shared"),
    "^@features/(.*)$": mapAlias("@features"),
    "^@assets/(.*)$": mapAlias("@assets"),
    "^@/(.*)$": mapAlias("@"),
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^.+\\.css$": "identity-obj-proxy",
    "^.+\\.svg\\?raw$": `${mocksDir}/rawSvgMock.cjs`,
    "^.+\\.(svg)$": `${mocksDir}/fileMock.cjs`,
  },
  extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            { targets: { node: "current" }, modules: false },
          ],
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
        plugins: ["@babel/plugin-transform-unicode-property-regex"],
      },
    ],
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  collectCoverage: false,
};
