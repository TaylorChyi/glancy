# API 快速测试指南

本文列下了使用 `curl` 验证 API 的简单方式和自动测试脚本。

## 使用脚本

scripts/curl-tests.sh 可以一次调用大多数 API：

```bash
./scripts/curl-tests.sh

# 自定义 BASE_URL
BASE_URL=http://127.0.0.1:8080 ./scripts/curl-tests.sh
```

## 单独使用 curl

如需测试单个接口，以下为示例：

```bash
curl -i http://localhost:8080/api/ping
curl -i -H "Content-Type: application/json" \
    -d '{"username":"demo","password":"pass123","email":"demo@example.com"}' \
    http://localhost:8080/api/users/register
```

更多示例请查看 README.md 以及上述脚本。

### 查询单词

```bash
curl -i "http://localhost:8080/api/words?userId=1&term=hello&language=ENGLISH"
curl -i "http://localhost:8080/api/words?userId=1&term=hello&language=ENGLISH&model=doubao"
```
