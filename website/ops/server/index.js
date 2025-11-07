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
