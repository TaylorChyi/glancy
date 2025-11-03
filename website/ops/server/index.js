/**
 * 背景：
 *  - 本地开发/预览服务器需跟随目录重构迁移到 ops/server，原相对路径已失效。
 * 目的：
 *  - 使用集中式 PATHS 提供 dist 目录解析，避免硬编码相对路径。
 * 关键决策与取舍：
 *  - 避免引入多余中间件，保持服务轻量。
 */
import express from "express";
import path from "path";
import { PATHS } from "../../config/shared/projectPaths.js";

const DIST_DIR = PATHS.dist;

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(DIST_DIR));

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
