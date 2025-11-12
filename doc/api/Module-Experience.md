# Module – Experience & Personalization

Covers controllers that tailor the UI layer: `UserPreferenceController`, `KeyboardShortcutController`, and `UserProfileController`. Tests live under `backend/src/test/java/com/glancy/backend/controller/*ControllerTest.java`.

## Preferences (`/api/preferences`)
| Method & Path | Description | Request / Response | Auth & Idempotency | Code & Tests |
|---------------|-------------|--------------------|--------------------|--------------|
| `POST /api/preferences/user` | Persist full preference set for the current user. | **Body** `UserPreferenceRequest` with `theme`, `systemLanguage`, `searchLanguage` (all strings). Returns `UserPreferenceResponse` (id, userId, the values). | Requires `X-USER-TOKEN`; creates or overwrites record so effectively idempotent per payload. | `UserPreferenceController.savePreference`
`UserPreferenceControllerTest.savePreference` |
| `PATCH /api/preferences/user` | Partial update of preferences. | **Body** `UserPreferenceUpdateRequest` where each field is optional; unspecified fields stay untouched. Returns `UserPreferenceResponse`. | Requires token; idempotent (only changed fields persist). | `UserPreferenceController.updatePreference`
`UserPreferenceControllerTest.updatePreference` |
| `GET /api/preferences/user` | Fetch stored preferences. | No body; returns `UserPreferenceResponse`. | Requires token; idempotent read. | `UserPreferenceController.getPreference`
`UserPreferenceControllerTest.getPreference` |

### Example
```jsonc
PATCH /api/preferences/user
{
  "theme": "dark",
  "searchLanguage": "ENGLISH"
}
```

## Keyboard Shortcuts (`/api/preferences/shortcuts`)
`ShortcutAction` enum values: `FOCUS_SEARCH`, `SWITCH_LANGUAGE`, `TOGGLE_THEME`, `TOGGLE_FAVORITE`, `OPEN_SHORTCUTS`. Default keys live in the enum definition.

| Method & Path | Description | Request / Response | Auth & Idempotency | Code & Tests |
|---------------|-------------|--------------------|--------------------|--------------|
| `GET /api/preferences/shortcuts/user` | Retrieve current shortcut bindings. | Response `KeyboardShortcutResponse` containing an array of `KeyboardShortcutView` (action, keys, defaultKeys). | Requires token; read-only. | `KeyboardShortcutController.getShortcuts`
`KeyboardShortcutControllerTest.Given_getRequest_When_fetchShortcuts_Then_returnPayload` |
| `PUT /api/preferences/shortcuts/user/{action}` | Update a single shortcut. | **Path** `action` must be a valid enum constant (case-insensitive). **Body** `KeyboardShortcutUpdateRequest` with `keys` array (≤4 strings, 1–40 chars). Response mirrors GET. | Requires token; idempotent for same payload. Service rejects duplicate modifiers and conflicting aliases. | `KeyboardShortcutController.updateShortcut`
`KeyboardShortcutControllerTest.Given_putRequest_When_updateShortcut_Then_delegateToService` |
| `DELETE /api/preferences/shortcuts/user` | Reset to defaults. | No body; response `KeyboardShortcutResponse`. | Requires token; idempotent. | `KeyboardShortcutController.resetShortcuts`
`KeyboardShortcutControllerTest.Given_deleteRequest_When_resetShortcuts_Then_delegateToService` |

## User Profiles (`/api/profiles`)
Profiles collect qualitative learning context and power downstream personalization.

| Method & Path | Description | Request / Response | Auth & Idempotency | Code & Tests |
|---------------|-------------|--------------------|--------------------|--------------|
| `POST /api/profiles/user` | Create or replace the user’s profile. | **Body** `UserProfileRequest` with fields such as `job`, `interest`, `goal`, `education`, `currentAbility`, `dailyWordTarget`, `futurePlan`, `responseStyle`, and `customSections` (array of `{ "title": "…", "items": [{ "label": "…", "value": "…" }] }`). Returns `UserProfileResponse`. | Requires token; overwrites existing profile (treat as UPSERT). | `UserProfileController.saveProfile`
`UserProfileControllerTest.saveProfile` |
| `GET /api/profiles/user` | Retrieve stored profile. | No body; returns `UserProfileResponse`. Lists and nested arrays are immutable copies on the wire. | Requires token; idempotent read. | `UserProfileController.getProfile`
`UserProfileControllerTest.getProfile` |

### Example profile payload
```jsonc
{
  "job": "Product Manager",
  "interest": "learning,travel",
  "goal": "Ace business English meetings",
  "education": "Bachelor",
  "currentAbility": "B2",
  "dailyWordTarget": 15,
  "futurePlan": "Take IELTS in Q3",
  "responseStyle": "humorous",
  "customSections": [
    {
      "title": "Motivations",
      "items": [
        { "label": "Trigger", "value": "New assignment" }
      ]
    }
  ]
}
```
