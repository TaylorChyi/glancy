export default {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/api/index.js$": "<rootDir>/test/__mocks__/apiIndexMock.cjs",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^.+\\.css$": "identity-obj-proxy",
    "^.+\\.svg\\?raw$": "<rootDir>/test/__mocks__/rawSvgMock.cjs",
    "^.+\\.(svg)$": "<rootDir>/test/__mocks__/fileMock.cjs",
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
