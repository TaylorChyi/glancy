# Module – Dictionary, Search History & Feedback

This module bundles dictionary lookup (`WordController`), search history (`SearchRecordController`), version introspection (`SearchResultVersionController`), and issue reporting (`WordIssueReportController`).

## Word Lookup (`/api/words`)
| Method & Path | Description | Query Parameters | Response & Notes | Auth | Code & Tests |
|---------------|-------------|------------------|------------------|------|--------------|
| `GET /api/words` | Resolve a word definition (LLM-backed). | `term` (required), `language` (`ENGLISH` or `CHINESE`), `flavor` (defaults to `BILINGUAL`; accepts `MONOLINGUAL_ENGLISH`, `MONOLINGUAL_CHINESE`), `model` (`doubao` currently), `forceNew` (boolean, default `false`), `captureHistory` (boolean, default `true`). | Returns `WordResponse` (definitions, phonetics, markdown, personalization, `versionId`). Deduplication is done via normalized terms before hitting the LLM. Setting `forceNew=true` bypasses cache. | Requires `X-USER-TOKEN`; quotas enforced downstream. | `WordController.getWord`
`WordControllerTest.*` |

### WordResponse snapshot
```jsonc
{
  "id": "1024",
  "term": "eloquent",
  "definitions": ["fluent or persuasive in speaking"],
  "language": "ENGLISH",
  "example": "an eloquent speech",
  "phonetic": "ˈeləkwənt",
  "variations": ["eloquence"],
  "synonyms": ["persuasive"],
  "antonyms": ["inarticulate"],
  "related": [],
  "phrases": [],
  "markdown": "### Definition...",
  "versionId": 88,
  "personalization": {
    "tone": "cheerful",
    "hooks": []
  },
  "flavor": "BILINGUAL"
}
```

## Search History (`/api/search-records`)
Free users may create up to 10 records per day (`search.limit.nonMember`). Requests reuse existing records if the normalized term matches the last 20 entries, ensuring idempotent UX.

| Method & Path | Description | Request / Response | Auth & Limits | Code & Tests |
|---------------|-------------|--------------------|---------------|--------------|
| `POST /api/search-records/user` | Append a search record and trigger dedup. | **Body** `SearchRecordRequest` (`term`, `language`, optional `flavor`). Returns `SearchRecordResponse` with latest `versions` metadata. | Token required; non-members limited to 10/day. Response indicates whether entry already existed (same id). | `SearchRecordController.create`
`SearchRecordControllerTest.testCreate` |
| `GET /api/search-records/user` | List history ordered by `updatedAt DESC`. | Query params `page`, `size` (default 0/20, max size 100). Response `List<SearchRecordResponse>`. Each item carries `latestVersion` plus `versions` summaries. | Token required. | `SearchRecordController.list`
`SearchRecordControllerTest.testList`, `.testListWithPagination` |
| `DELETE /api/search-records/user` | Clear entire history. | No body; 204 response. | Token required; idempotent. | `SearchRecordController.clear`<br>_Test gap: controller path not yet covered; logic validated inside `SearchRecordService`._ |
| `POST /api/search-records/user/{recordId}/favorite` | Mark record favorite. | No body; returns updated `SearchRecordResponse`. | Token required. | `SearchRecordController.favorite`<br>_Test gap: add dedicated mock MVC test when the UI ships favorites._ |
| `DELETE /api/search-records/user/{recordId}/favorite` | Remove favorite. | No body; 204. | Token required. | `SearchRecordController.unfavorite`<br>_Test gap: same as favorite._ |
| `DELETE /api/search-records/user/{recordId}` | Soft delete record. | No body; 204. Also cascades to versions via `SearchResultService`. | Token required. | `SearchRecordController.delete`<br>_Test gap: rely on `SearchRecordService` integration tests until controller coverage is added._ |

### SearchRecordResponse structure
```jsonc
{
  "id": 501,
  "userId": 1,
  "term": "eloquent",
  "language": "ENGLISH",
  "flavor": "BILINGUAL",
  "createdAt": "2024-05-01T08:15:30Z",
  "favorite": true,
  "latestVersion": {
    "id": 88,
    "versionNumber": 3,
    "createdAt": "2024-05-01T08:16:10Z",
    "model": "doubao",
    "preview": "### Definition...",
    "flavor": "BILINGUAL"
  },
  "versions": []
}
```

## Version Browser (`/api/words/{recordId}/versions`)
| Method & Path | Description | Response | Auth | Code & Tests |
|---------------|-------------|----------|------|--------------|
| `GET /api/words/{recordId}/versions` | List all saved versions for a search record (most recent first). | `List<SearchRecordVersionSummary>` (id, versionNumber, createdAt, model, preview, flavor). | Token required; verifies record ownership before returning data. | `SearchResultVersionController.listVersions`
`SearchResultVersionControllerTest.listVersionsReturnsSummaries` |
| `GET /api/words/{recordId}/versions/{versionId}` | Retrieve full content for a version. | `SearchResultVersionResponse` (includes `content` Markdown, `model`, `term`, `language`, `createdAt`). | Token required; ensures both record and version belong to user. | `SearchResultVersionController.getVersion`
`SearchResultVersionControllerTest.getVersionReturnsDetail` |

### Version detail excerpt
```jsonc
{
  "id": 88,
  "recordId": 501,
  "wordId": 1024,
  "userId": 1,
  "term": "eloquent",
  "language": "ENGLISH",
  "versionNumber": 3,
  "model": "doubao",
  "preview": "### Definition...",
  "content": "### Definition\n- ...",
  "createdAt": "2024-05-01T08:16:10Z"
}
```

## Word Issue Reporting (`/api/word-reports`)
| Method & Path | Description | Request / Response | Auth | Code & Tests |
|---------------|-------------|--------------------|------|--------------|
| `POST /api/word-reports` | Allow logged-in users to flag incorrect entries. | **Body** `WordIssueReportRequest` with `term`, `language`, `flavor`, `category` (`INCORRECT_MEANING`, `MISSING_INFORMATION`, `INAPPROPRIATE_CONTENT`, `OTHER`), optional `description` (≤2000 chars) and `sourceUrl` (≤500 chars). Returns `WordIssueReportResponse`. | Requires token; idempotent only if same payload. | `WordIssueReportController.create`
`WordIssueReportControllerTest.createReport_returnsCreated` |

### Example payload
```jsonc
{
  "term": "eloquent",
  "language": "ENGLISH",
  "flavor": "BILINGUAL",
  "category": "INCORRECT_MEANING",
  "description": "Definition does not cover modern usage",
  "sourceUrl": "https://example.com/eloquent"
}
```

## Implementation Notes
- Search record pagination uses `SearchRecordPageRequest` ensuring `page ≥ 0` and `1 ≤ size ≤ 100`.
- `SearchResultService` sanitizes Markdown previews via `SensitiveDataUtil.previewText`, keeping SSE/event logs compact if streamed.
- All controllers rely on `@AuthenticatedUser Long userId` to obtain the principal; tokens are mandatory except for admin endpoints documented elsewhere.
