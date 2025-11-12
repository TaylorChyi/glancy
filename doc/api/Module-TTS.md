# Module – Text-To-Speech (TTS)

Entry point: `backend/src/main/java/com/glancy/backend/controller/TtsController.java`. Supporting components include `VolcengineTtsService`, `TtsRequestValidator`, `TtsQuotaService`, and `TtsRateLimiter`. Tests: `TtsControllerTest` (happy paths) and `TtsControllerValidationIT` (validation + membership constraints).

## Request Schema (`TtsRequest`)
| Field | Type / Constraints | Purpose |
|-------|--------------------|---------|
| `text` | string, required, trimmed | Content to synthesize. |
| `lang` | string, required, e.g., `en-US`, `zh-CN` | Determines voice group in `tts-config.yml`. |
| `voice` | string, optional | Voice id; falls back to language default. Membership is validated via `TtsRequestValidator`. |
| `format` | regex `mp3` only | Output encoding. |
| `speed` | decimal between 0.5 and 2.0 | Playback speed multiplier. |
| `shortcut` | boolean (default `true`) | When true, cache misses return `204` so the client can decide whether to trigger synthesis. |
| `operation` | `QUERY` (default) or `SUBMIT` | `SUBMIT` reserves the right to switch to streaming delivery with SSE; `QUERY` waits for the full clip. |

## Endpoints (`/api/tts`)
| Method & Path | Description | Request / Response | Auth & Limits | Code & Tests |
|---------------|-------------|--------------------|---------------|--------------|
| `POST /api/tts/word` | JSON-based word pronunciation synthesis. | **Body** `TtsRequest`. Responds with `TtsResponse` on cache hit or 201-level success; returns `204` when `shortcut=true` and cache miss. | Requires `X-USER-TOKEN`. Enforced by rate limiter (30/min per user, 120/min per IP, burst 20, cooldown 60 s) and daily quota (5 free / 100 member by default). | `TtsController.synthesizeWord`
`TtsControllerTest.synthesizeWordReturnsAudio`
`TtsControllerTest.synthesizeWordCacheMissReturns204`
`TtsControllerValidationIT.*` |
| `GET /api/tts/word` | Parameter-based “stream” variant for simpler clients. | Query parameters mirror `TtsRequest` (text, lang, voice?, format?, speed?). Responds with the same `TtsResponse`. | Same auth/limits. Accepts `shortcut` via query string. | `TtsController.streamWord`
`TtsControllerTest.streamWordReturnsPayload` |
| `POST /api/tts/sentence` | Generate longer utterances from JSON body. | Same as `/word` but uses sentence pipeline. | Same auth/limits. | `TtsController.synthesizeSentence`
`TtsControllerValidationIT.synthesizeSentenceWithProVoiceByFreeUserReturns403` |
| `GET /api/tts/sentence` | GET variant for sentences. | Query parameters identical to `/word`. Response `TtsResponse`. | Same. | `TtsController.streamSentence`
`TtsControllerTest.streamSentenceReturnsPayload` |
| `GET /api/tts/voices?lang=en` | List voice options for a language. | Response `VoiceResponse` with `default` and `options[]` (`VoiceOption` = id, label, plan). Currently proxies `VolcengineTtsClient#getDefaultVoice`. | Requires token; plan filtering enforced client-side until expanded. | `TtsController.listVoices`
`TtsControllerTest.listVoicesReturnsOptions` |

## Streaming / Chunk Format
Both GET variants are optimized for low-latency delivery. When the client sends `Accept: text/event-stream`, the server emits SSE frames with the following payload envelope per chunk:

```text
event: audio
data: {"seq":1,"final":false,"payload":{"data":"<base64>","duration_ms":200,"format":"mp3","from_cache":false}}
```

| Field | Description | Source |
|-------|-------------|--------|
| `seq` | 1-based incremental sequence. Clients should assemble audio chunks in order. | Generated inside the SSE adapter (mirrors chunk index). |
| `final` | Boolean flag indicating the last chunk. | Derived from upstream completion signal (`CompletionSentinel` / cache hit). |
| `payload.data` | Base64-encoded audio bytes (`byte[] data` from `TtsResponse`). | `TtsResponse#getData`. |
| `payload.duration_ms` | Clip duration in milliseconds. | `TtsResponse#durationMs`. |
| `payload.format` | Encoding, currently `mp3`. | `TtsResponse#format`. |
| `payload.from_cache` | True if served from cache. Allows clients to skip UI spinners. | `TtsResponse#isFromCache`. |

Clients that prefer aggregated responses can keep `Accept: application/json`; the controller will return the final `payload` object directly.

## Voice Plans & Validation
- Voice availability is declared in `src/main/resources/tts-config.yml`. Each option lists a `plan` (`all`, `plus`, `pro`, `premium`).
- `TtsRequestValidator` ensures the caller’s membership (`MembershipType`) satisfies the plan and throws `ForbiddenException` if not (`UserControllerTest` verifies membership metadata in login responses).
- Unsupported languages raise `InvalidRequestException` with message `不支持的语言`.

## Quota Enforcement
- `TtsQuotaService.verifyQuota` is invoked before synthesis; exceeding the daily limit results in HTTP 403 with `今日配额已用完`.
- `recordUsage` should be called only after a successful call to keep counts accurate. Payload caching honors `tts-config.features.countCachedAsUsage` (currently `false`).

## Error Scenarios
| Scenario | Response | Tests |
|----------|----------|-------|
| Invalid parameters (empty text, unsupported format) | 422 `请求参数不合法`. | `TtsControllerValidationIT.synthesizeWordWithUnsupportedLanguageReturns422`. |
| Free user selects pro-only voice | 403 `该音色仅对 pro 及以上会员开放`. | `TtsControllerValidationIT.synthesizeSentenceWithProVoiceByFreeUserReturns403`. |
| Rate limit exceeded | 429 `请{n}秒后重试`. | `TtsRateLimiterTest` (service layer). |
| Upstream Volcengine failure | 424 `TTS provider error: ...`. | `VolcengineTtsClient` unit/integration tests. |

## Voice Listing Example
```jsonc
GET /api/tts/voices?lang=en-US
{
  "default": "en_male_corey_emo_v2_mars_bigtts",
  "options": [
    { "id": "en_male_corey_emo_v2_mars_bigtts", "label": "Corey", "plan": "all" },
    { "id": "en_female_nadia_tips_emo_v2_mars_bigtts", "label": "Nadia", "plan": "pro" }
  ]
}
```
