export default {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^.+\\.css$": "identity-obj-proxy",
    "^.+\\.(svg)$": "<rootDir>/test/__mocks__/fileMock.cjs",
  },
  extensionsToTreatAsEsm: [".jsx", ".ts", ".tsx"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
      },
    ],
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  collectCoverage: false,
};
