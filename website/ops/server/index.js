/**
 * 背景：
 *  - 本地开发/预览服务器需跟随目录重构迁移到 ops/server，原相对路径已失效。
 * 目的：
 *  - 使用集中式 PATHS 提供 dist 目录解析，避免硬编码相对路径。
 * 关键决策与取舍：
 *  - 继续沿用 Express + geoip-lite 提供最小可用的 locale API；
 *  - 不引入额外中间件，保持服务轻量。
 */
import express from "express";
import path from "path";
import geoip from "geoip-lite";
import { COUNTRY_LANGUAGE_MAP } from "./config/countryLanguageMap.js";
import { PATHS } from "../../config/shared/projectPaths.js";

const DIST_DIR = PATHS.dist;

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(DIST_DIR));

app.set("trust proxy", true);

app.get("/api/locale", (req, res) => {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",").shift() ||
    req.socket?.remoteAddress ||
    "127.0.0.1";
  const geo = geoip.lookup(ip);
  const country = geo?.country || "US";
  const lang = COUNTRY_LANGUAGE_MAP[country] || "en";
  res.json({ country, lang });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
