# Module – Users & Identity

Primary source: `backend/src/main/java/com/glancy/backend/controller/UserController.java`. Contract coverage lives in `backend/src/test/java/com/glancy/backend/controller/UserControllerTest.java`.

## Registration & Authentication
| Method & Path | Description | Request / Response | Auth & Idempotency | Code & Tests |
|---------------|-------------|--------------------|--------------------|--------------|
| `POST /api/users/register` | Username/password signup with implicit email binding. | **Body** `UserRegistrationRequest` → `username` (3–50 chars), `password` (≥6), `email`, `phone`, optional `avatar`.<br>**Response** `UserResponse` (id, username, avatar, membership metadata). | Public; non-idempotent (email uniqueness enforced). Duplicate submissions trigger 409/422. | `UserController.register`
`UserControllerTest.register` |
| `POST /api/users/email/verification-code` | Dispatch verification code for registration/login/email change. | **Body** `EmailVerificationCodeRequest` with `email` + `purpose` (`REGISTER`, `LOGIN`, `CHANGE_EMAIL`). Captures client IP via `ClientIpResolver`. | Public; throttled via downstream mail service. Safe to retry after 60 s. | `UserController.sendVerificationCode`
`UserControllerTest.requestEmailChangeCode` (IP logging) |
| `POST /api/users/register/email` | Complete signup using email code. | **Body** `EmailRegistrationRequest` (`email`, `code`, `username`, `password`, `phone`, optional `avatar`).<br>**Response** `UserResponse`. | Public; non-idempotent because code can only be used once. | `UserController.registerWithEmail`
Scenario covered via service mocks in `UserControllerTest.register` |
| `POST /api/users/login` | Username/email/password login. | **Body** `LoginRequest` with `account`, `password`, optional `deviceInfo`.<br>**Response** `LoginResponse` (user profile + `token`). | Public; idempotent. Rate-limit at gateway if needed. | `UserController.login`
`UserControllerTest.login` |
| `POST /api/users/login/email` | Password-less login using email code. | **Body** `EmailLoginRequest` (`email`, `code`, `deviceInfo?`).<br>**Response** `LoginResponse`. | Public; verification codes are single-use. | `UserController.loginWithEmail`
`UserControllerTest.loginWithPhone` (email flow naming legacy) |
| `POST /api/users/{id}/logout` | Invalidate the user’s current token. | **Headers** `X-USER-TOKEN` (required). Path id is ignored; the authenticated principal determines the actual account.<br>**Response** `204 No Content`. | Requires valid token; idempotent. | `UserController.logout`
`UserControllerTest.logout` |

### Example – password signup
```jsonc
POST /api/users/register
{
  "username": "lex",
  "password": "p@ssw0rd",
  "email": "lex@example.com",
  "phone": "+8613800138000",
  "avatar": "https://cdn.glancy.xyz/a/lex.png"
}
```
```jsonc
201 Created
{
  "id": 42,
  "username": "lex",
  "email": "lex@example.com",
  "avatar": "https://cdn.glancy.xyz/a/lex.png",
  "phone": "+8613800138000",
  "member": false,
  "membershipType": "NONE",
  "membershipExpiresAt": null
}
```

## Account & Contact Management
| Method & Path | Description | Request / Response | Auth & Idempotency | Code & Tests |
|---------------|-------------|--------------------|--------------------|--------------|
| `DELETE /api/users/{id}` | Logical delete of a user. | No body. | Admin/internal use; not guarded by token in controller yet—ensure gateway ACLs. | `UserController.delete`
`UserControllerTest.deleteUser` |
| `GET /api/users/{id}` | Retrieve full profile (including audit fields). | Path id; returns `UserDetailResponse` (record-based DTO with metadata + version field). | Internal/admin; idempotent read. | `UserController.getUser`
`UserControllerTest.getUser` |
| `POST /api/users/{id}/third-party-accounts` | Bind external account identifiers. | **Body** `ThirdPartyAccountRequest` (`provider`, `externalId`).<br>**Response** `ThirdPartyAccountResponse`. | Requires token; non-idempotent (fails on duplicates). | `UserController.bindThirdParty`
`UserControllerTest.bindThirdParty` |
| `GET /api/users/{id}/avatar` | Fetch avatar URL. | No body; returns `AvatarResponse`. | Requires token of owner (checked inside service). Read-only. | `UserController.getAvatar`
`UserControllerTest.getAvatar` |
| `PUT /api/users/{id}/avatar` | Update avatar URL. | **Body** `AvatarRequest` (`avatar` URL). Returns `AvatarResponse`. | Requires token; idempotent (absolute URL). | `UserController.updateAvatar`
`UserControllerTest.updateAvatar` |
| `POST /api/users/{id}/avatar-file` | Multipart upload to OSS then update avatar. | **Form** field `file` (≤5 MB). Returns `AvatarResponse`. | Requires token; non-idempotent upload but safe to retry (new object replaces old). | `UserController.uploadAvatar`
`UserControllerTest.uploadAvatar` |
| `PUT /api/users/{id}/username` | Change display name. | **Body** `UsernameRequest`. Returns `UsernameResponse`. | Token required; idempotent. | `UserController.updateUsername`
_Test coverage pending; add to `UserControllerTest`._ |
| `PUT /api/users/{id}/contact` | Update email/phone pair. | **Body** `UserContactRequest` (`email?`, `phone` with `^\+?[0-9]{3,}$`). Returns `UserContactResponse`. | Token required; idempotent. | `UserController.updateContact`
`UserControllerTest.updateContact` |
| `POST /api/users/{id}/email/change-code` | Send verification code to a new email before binding. | **Body** `EmailChangeInitiationRequest` (`email`). Response `202`. | Token required; rate-limited by mail service. | `UserController.requestEmailChangeCode`
`UserControllerTest.requestEmailChangeCode` |
| `PUT /api/users/{id}/email` | Bind new email using code. | **Body** `EmailChangeRequest` (`email`, `code`). Returns `UserEmailResponse`. | Token required; idempotent for same email. | `UserController.changeEmail`
`UserControllerTest.changeEmail` |
| `DELETE /api/users/{id}/email` | Unbind email. | No body; returns `UserEmailResponse` (null email). | Token required; idempotent. | `UserController.unbindEmail`
`UserControllerTest.unbindEmail` |
| `GET /api/users/count` | Count active users. | No parameters. Returns integer. | Internal. Use admin token or protect via network ACL. | `UserController.countUsers`
`UserControllerTest.countUsers` |

### Notes
- Validation annotations reside on DTOs (`backend/src/main/java/com/glancy/backend/dto`). Messages are localized via `messages.properties`.
- Phone numbers must include country code (or at least 3 digits). Email addresses follow Jakarta validation semantics.
- Multipart uploads honor `spring.servlet.multipart` size limits (5 MB by default).
