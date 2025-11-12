# Module – Users & Identity

Primary source: `backend/src/main/java/com/glancy/backend/controller/UserController.java`. Relevant WebMvc slices live in:
- `UserControllerRegistrationTest`
- `UserControllerLoginTest`
- `UserControllerPermissionTest`
Integration paths fall back to service-layer suites such as `UserServiceRegistrationTest` and `UserServiceEmailChangeTest` when controller coverage is pending.

## Registration & Authentication
| Method & Path | Description | Request / Response | Auth & Idempotency | Code & Tests |
|---------------|-------------|--------------------|--------------------|--------------|
| `POST /api/users/register` | Username/password signup with implicit email binding. | **Body** `UserRegistrationRequest` → `username` (3–50 chars), `password` (≥6), `email`, `phone`, optional `avatar`.<br>**Response** `UserResponse` (id, username, avatar, membership metadata). | Public; non-idempotent (email uniqueness enforced). Duplicate submissions trigger 409/422. | `UserController.register`<br>`UserControllerRegistrationTest.register` |
| `POST /api/users/email/verification-code` | Dispatch verification code for registration/login/email change. | **Body** `EmailVerificationCodeRequest` with `email` + `purpose` (`REGISTER`, `LOGIN`, `CHANGE_EMAIL`). Captures client IP via `ClientIpResolver`. | Public; throttled via downstream mail service. Safe to retry after 60 s. | `UserController.sendVerificationCode`<br>_Controller coverage pending_; issuance logic exercised in `UserServiceEmailChangeTest.testRequestEmailChangeCode`. |
| `POST /api/users/register/email` | Complete signup using email code. | **Body** `EmailRegistrationRequest` (`email`, `code`, `username`, `password`, `phone`, optional `avatar`).<br>**Response** `UserResponse`. | Public; non-idempotent because code can only be used once. | `UserController.registerWithEmail`<br>_Controller coverage pending_; refer to `UserServiceRegistrationTest.testRegisterAndDeleteUser`. |
| `POST /api/users/login` | Username/email/password login. | **Body** `LoginRequest` with `account`, `password`, optional `deviceInfo`.<br>**Response** `LoginResponse` (user profile + `token`). | Public; idempotent. Rate-limit at gateway if needed. | `UserController.login`<br>`UserControllerLoginTest.login` |
| `POST /api/users/login/email` | Password-less login using email code. | **Body** `EmailLoginRequest` (`email`, `code`, `deviceInfo?`).<br>**Response** `LoginResponse`. | Public; verification codes are single-use. | `UserController.loginWithEmail`<br>_Controller coverage pending_; code normalization verified in `UserServiceEmailChangeTest.Given_CodeWithWhitespace_When_ChangeEmail_Then_TrimBeforeConsume`. |
| `POST /api/users/{id}/logout` | Invalidate the user’s current token. | **Headers** `X-USER-TOKEN` (required). Path id is ignored; the authenticated principal determines the actual account.<br>**Response** `204 No Content`. | Requires valid token; idempotent. | `UserController.logout`<br>`UserControllerLoginTest.logout` |

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
| `DELETE /api/users/{id}` | Logical delete of a user. | No body. | Admin/internal use; not guarded by token in controller yet—ensure gateway ACLs. | `UserController.delete`<br>`UserControllerPermissionTest.deleteUser` |
| `GET /api/users/{id}` | Retrieve full profile (including audit fields). | Path id; returns `UserDetailResponse` (record-based DTO with metadata + version field). | Internal/admin; idempotent read. | `UserController.getUser`<br>`UserControllerRegistrationTest.getUser` |
| `POST /api/users/{id}/third-party-accounts` | Bind external account identifiers. | **Body** `ThirdPartyAccountRequest` (`provider`, `externalId`).<br>**Response** `ThirdPartyAccountResponse`. | Requires token; non-idempotent (fails on duplicates). | `UserController.bindThirdParty`<br>`UserControllerRegistrationTest.bindThirdParty` |
| `GET /api/users/{id}/avatar` | Fetch avatar URL. | No body; returns `AvatarResponse`. | Requires token of owner (checked inside service). Read-only. | `UserController.getAvatar`<br>`UserControllerPermissionTest.getAvatar` |
| `PUT /api/users/{id}/avatar` | Update avatar URL. | **Body** `AvatarRequest` (`avatar` URL). Returns `AvatarResponse`. | Requires token; idempotent (absolute URL). | `UserController.updateAvatar`<br>`UserControllerPermissionTest.updateAvatar` |
| `POST /api/users/{id}/avatar-file` | Multipart upload to OSS then update user record. | **Form** field `file` (≤5 MB). Returns `AvatarResponse`. | Requires token; non-idempotent upload but safe to retry (new object replaces old). | `UserController.uploadAvatar`<br>`UserControllerPermissionTest.uploadAvatar` |
| `PUT /api/users/{id}/username` | Change display name. | **Body** `UsernameRequest`. Returns `UsernameResponse`. | Token required; idempotent. | `UserController.updateUsername`<br>_Test coverage pending; add WebMvc slice mirroring other operations._ |
| `PUT /api/users/{id}/contact` | Update email/phone pair. | **Body** `UserContactRequest` (`email?`, `phone` with `^\+?[0-9]{3,}$`). Returns `UserContactResponse`. | Token required; idempotent. | `UserController.updateContact`<br>`UserControllerRegistrationTest.updateContact` |
| `POST /api/users/{id}/email/change-code` | Send verification code to a new email before binding. | **Body** `EmailChangeInitiationRequest` (`email`). Response `202`. | Token required; rate-limited by mail service. | `UserController.requestEmailChangeCode`<br>`UserControllerRegistrationTest.requestEmailChangeCode` |
| `PUT /api/users/{id}/email` | Bind new email using code. | **Body** `EmailChangeRequest` (`email`, `code`). Returns `UserEmailResponse`. | Token required; idempotent for same email. | `UserController.changeEmail`<br>`UserControllerRegistrationTest.changeEmail` |
| `DELETE /api/users/{id}/email` | Unbind email. | No body; returns `UserEmailResponse` (null email). | Token required; idempotent. | `UserController.unbindEmail`<br>`UserControllerRegistrationTest.unbindEmail` |
| `GET /api/users/count` | Count active users. | No parameters. Returns integer. | Internal. Use admin token or protect via network ACL. | `UserController.countUsers`<br>`UserControllerPermissionTest.countUsers` |

### Notes
- Validation annotations reside on DTOs (`backend/src/main/java/com/glancy/backend/dto`). Messages are localized via `messages.properties`.
- Phone numbers must include country code (or at least 3 digits). Email addresses follow Jakarta validation semantics.
- Multipart uploads honor `spring.servlet.multipart` size limits (5 MB by default).
