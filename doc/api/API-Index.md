# Glancy API Index

This index summarizes the public REST surface of the Glancy backend located under `backend/`. Module-specific details live in sibling documents referenced below.

## Base URL & Versioning
- Default base path: `/api`. Deployments usually expose `https://<env>.glancy.xyz/api`.
- No global version prefix yet; breaking changes are coordinated per module via tests in `backend/src/test/java/com/glancy/backend/controller`.

## Authentication & Traceability
- **Token header**: send `X-USER-TOKEN: <uuid>` (alias query parameter `token`). Resolution logic lives in `TokenResolver` and `TokenAuthenticationFilter`.
- **Request context**: `TokenTraceFilter` stamps every call with `req.id` (returned as `rid` in 404 bodies) and `auth.token.status` for audit logging.
- **@AuthenticatedUser** parameters map automatically to the resolved user id or entity; missing/invalid tokens trigger the NOT_FOUND-style response emitted by `SecurityConfig`.

## Request & Response Conventions
- JSON is the default media type; controllers only emit other types for multipart uploads and binary data."`data`" fields (e.g., TTS) are Base64 strings.
- Successful writes return `201 Created` when new resources are produced, `200 OK` otherwise, and `204 No Content` when using shortcut/clear operations.
- Error payloads follow `ErrorResponse` → `{ "message": "..." }`. Messages are localized (CN) by default.

## Error Map & Codes
| HTTP | Logical code | Message shape | Trigger (exception) | Implementation |
|------|--------------|---------------|---------------------|----------------|
| 400  | ERR_BAD_REQUEST | `Missing required parameter: term` / `Invalid value for parameter: language` | `MissingServletRequestParameterException`, `MethodArgumentTypeMismatchException` | `backend/src/main/java/com/glancy/backend/exception/GlobalExceptionHandler.java` |
| 401  | ERR_UNAUTHORIZED | `Invalid token` | `UnauthorizedException`, auth filter failures | `TokenAuthenticationFilter`, `GlobalExceptionHandler.handleUnauthorized` |
| 403  | ERR_FORBIDDEN | `该音色仅对 pro 及以上会员开放` / `今日配额已用完` | `ForbiddenException`, `QuotaExceededException` | `GlobalExceptionHandler.handleForbidden`, `TtsQuotaService` |
| 404  | ERR_NOT_FOUND | `未找到资源`, includes `rid` | `ResourceNotFoundException`, auth fallback | `SecurityConfig.authEntryPoint`, `GlobalExceptionHandler` |
| 409  | ERR_CONFLICT | `兑换码已存在` | `DuplicateResourceException` | `RedemptionCodeService.createCode` |
| 413  | ERR_PAYLOAD_TOO_LARGE | `上传文件过大` | `MaxUploadSizeExceededException` | `GlobalExceptionHandler.handleMaxSize` |
| 422  | ERR_INVALID_REQUEST | Validation failures such as `请求参数不合法`, `兑换冲突，请稍后重试` | `InvalidRequestException`, Bean Validation | `GlobalExceptionHandler.handleInvalidRequest` |
| 424  | ERR_TTS_PROVIDER | `TTS provider error: ...` | `TtsFailedException` | `GlobalExceptionHandler.handleTtsFailure`, `VolcengineTtsClient` |
| 429  | ERR_RATE_LIMIT | `请{seconds}秒后重试` | `RateLimitExceededException` from `TtsRateLimiter` | `GlobalExceptionHandler.handleRateLimit` |
| 503  | ERR_DEGRADED | `服务暂不可用` style messages | `ServiceDegradedException` | `GlobalExceptionHandler.handleServiceDegraded` |

## Idempotency & Retry Guidance
| Operation | Idempotency expectation | Notes |
|-----------|------------------------|-------|
| `GET`, `PUT`, `DELETE` endpoints | Idempotent by contract | Controllers only mutate state on POST with rare exceptions (see below). |
| `POST /api/search-records/user` | Conditionally idempotent | Internally deduplicated via `DictionaryTermNormalizer`; repeated submission of the same term/language/flavor within the last 20 records updates timestamps instead of inserting duplicates (`SearchRecordService`). |
| `POST /api/tts/{word|sentence}` | Safe to retry when `shortcut=true` | On cache miss the service returns `204`, allowing clients to back off or retry with `shortcut=false`. Avoid replaying when synthesis already started to keep quota accurate. |
| `POST /api/redemption-codes/redeem` | Non-idempotent but concurrency safe | `RedemptionCodeService` uses optimistic locking and per-user quotas; treat duplicate submissions as errors and surface the returned message to the user. |
| `POST /api/users/register`, `/register/email`, `/email/verification-code` | Non-idempotent | Duplicate identifiers yield `409`/`422`. Clients should debounce UI forms. |

## Rate Limiting, Quotas & Backoff
- **TTS per-minute limits**: `TtsRateLimiter` enforces 30 requests/user/minute and 120 requests/IP/minute with a burst of 20 and a cooldown of 60 seconds (`tts-config.yml`). Respect the returned seconds in the 429 message before retrying.
- **TTS daily quota**: `TtsQuotaService` allows 5 daily synthesizes for free users and 100 for members (configurable). Calls beyond the limit raise `QuotaExceededException` (403).
- **Search history**: free users can create at most 10 records per day (`search.limit.nonMember`), enforced inside `SearchRecordService.saveRecord`.
- **Redemption codes**: `RedemptionCodeService` enforces total quota, per-user quota, validity window, and raises 422 with `兑换冲突` if concurrent redemption happens.
- **Backoff strategy**: use the retry-after seconds embedded in `RateLimitExceededException` messages, exponential backoff for 5xx/424, and never retry membership/commerce mutations without explicit user consent.

## Streaming Delivery Overview
`TtsController` exposes "stream" variants (`GET /api/tts/word|sentence`) for latency-sensitive clients. These routes return the `TtsResponse` schema `{ "data": "<base64>", "duration_ms": 1000, "format": "mp3", "from_cache": false }`. As of this release responses remain JSON even for `Accept: text/event-stream` requests, while the SSE envelope documented in [Module-TTS](Module-TTS.md) is reserved for the future `operation=SUBMIT` rollout.

## Module Documents
- [Module-Users](Module-Users.md)
- [Module-Experience](Module-Experience.md)
- [Module-Dictionary](Module-Dictionary.md)
- [Module-TTS](Module-TTS.md)
- [Module-Redemption](Module-Redemption.md)

## Minimal SDK Examples
### JavaScript (ESM)
```js
import fetch from "node-fetch";

const token = process.env.GLANCY_TOKEN;
const baseUrl = "https://api.glancy.xyz";

export async function lookup(term) {
  const params = new URLSearchParams({ term, language: "ENGLISH" });
  const resp = await fetch(`${baseUrl}/api/words?${params}`, {
    headers: {
      "X-USER-TOKEN": token,
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    throw new Error(`Lookup failed: ${resp.status} ${(await resp.json()).message}`);
  }
  return resp.json();
}
```

### Java 17 (HttpClient)
```java
HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest
    .newBuilder(URI.create("https://api.glancy.xyz/api/tts/word"))
    .header("X-USER-TOKEN", System.getenv("GLANCY_TOKEN"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("{" +
        "\"text\":\"hello\"," +
        "\"lang\":\"en-US\"," +
        "\"shortcut\":true" +
        "}"))
    .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
if (response.statusCode() == 204) {
  // cache miss - retry later without shortcut or after cooldown
}
```
