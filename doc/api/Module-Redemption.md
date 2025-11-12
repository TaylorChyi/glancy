# Module – Redemption Codes & Benefits

Controller: `backend/src/main/java/com/glancy/backend/controller/RedemptionCodeController.java`. Business rules live inside `RedemptionCodeService` and `service/redemption/effect` processors. Tests: `backend/src/test/java/com/glancy/backend/service/redemption/RedemptionCodeServiceTest.java`.

## Endpoint Matrix (`/api/redemption-codes`)
| Method & Path | Description | Request / Response | Auth & Idempotency | Code & Tests |
|---------------|-------------|--------------------|--------------------|--------------|
| `POST /api/redemption-codes` | Create a redemption code configuration. Intended for back-office tooling. | **Body** `RedemptionCodeCreateRequest`:<br>- `code` (case-insensitive, stored upper-case)<br>- `redeemableFrom` / `redeemableUntil` (ISO-8601 datetimes, end must be after start)<br>- `totalQuota` (≥1)<br>- `perUserQuota` (≥1, ≤ total)<br>- `effect` (`RedemptionEffectConfig`) that wraps either `membership` or `discount` config depending on `type`.<br>**Response** `RedemptionCodeResponse` including derived totals and effect snapshot. | Should be authenticated/admin-only (controller currently open—protect via gateway). Idempotent per `code`; duplicates raise `DuplicateResourceException` (409). | `RedemptionCodeController.createCode`
`RedemptionCodeServiceTest.createCode_withDuplicate_shouldFail` |
| `GET /api/redemption-codes/{code}` | Fetch public details for a code (for preview screens). | Path variable is normalized uppercase. Response `RedemptionCodeResponse`. | No token required (codes are usually public). Cache aggressively as configs change rarely. | `RedemptionCodeController.findByCode`
`RedemptionCodeServiceTest.findByCode` |
| `POST /api/redemption-codes/redeem` | Redeem a code for the authenticated user. | **Auth** `X-USER-TOKEN` → `@AuthenticatedUser User`. **Body** `RedemptionRedeemRequest` with `code` string.<br>**Response** `RedemptionRedeemResponse` containing `effectType`, plus either `membership` reward (`MembershipRewardResponse`) or `discount` reward (`DiscountRewardResponse`). | Requires token. Non-idempotent (each successful redemption consumes quota). Built-in safeguards: per-user quota, validity window, optimistic locking to detect concurrent over-redemption (`兑换冲突，请稍后重试`). | `RedemptionCodeController.redeem`
`RedemptionCodeServiceTest.redeem_happyPath`, `.redeem_whenQuotaExceeded` |

## Effect Configurations
- **Membership (`type=MEMBERSHIP`)**: Provide `membershipType` (`PLUS`, `PRO`, `PREMIUM`) and `extensionHours` (long, >0). The service converts this to `MembershipLifecycleService.extendMembership`, returning a `MembershipRewardResponse` with new expiry.
- **Discount (`type=DISCOUNT`)**: Provide `percentage` (`0.01`–`100`), `validFrom`, `validUntil`. The service persists a `UserDiscountBenefit` record and responds with `DiscountRewardResponse`.

## Quotas & Concurrency
- `RedemptionCodeService` checks `code.hasRemainingQuota()` (total) and `countByCodeIdAndUserId` (per-user).
- Operations rely on optimistic locking via JPA versioning; on conflict the service emits `InvalidRequestException("兑换冲突，请稍后重试")` (HTTP 422). Clients should surface the message and allow retry after a short delay.
- Timestamps use the injected `Clock`, enabling deterministic tests.

## Sample Payloads
### Create a membership code
```jsonc
POST /api/redemption-codes
{
  "code": "SPRINGPRO",
  "redeemableFrom": "2024-03-01T00:00:00Z",
  "redeemableUntil": "2024-06-01T00:00:00Z",
  "totalQuota": 1000,
  "perUserQuota": 1,
  "effect": {
    "type": "MEMBERSHIP",
    "membership": {
      "membershipType": "PRO",
      "extensionHours": 720
    }
  }
}
```

### Redeem response snapshot
```jsonc
POST /api/redemption-codes/redeem
{
  "code": "SPRINGPRO"
}
```
```jsonc
200 OK
{
  "code": "SPRINGPRO",
  "effectType": "MEMBERSHIP",
  "membership": {
    "membershipType": "PRO",
    "expiresAt": "2024-09-01T00:00:00Z"
  },
  "discount": null
}
```

## Failure Cases
| Scenario | HTTP / Message | Notes |
|----------|----------------|-------|
| Code not found or deleted | 404 `兑换码不存在` | Via `ResourceNotFoundException`. |
| Outside validity window | 422 `兑换未在有效期内` | Compare `redeemableFrom`/`Until` against `Clock`. |
| Total quota exhausted | 422 `兑换次数已用尽` | `code.hasRemainingQuota()` false. |
| Per-user quota exceeded | 422 `已超过个人兑换次数` | Determined by `RedemptionRecordRepository.countByCodeIdAndUserId`. |
| Membership config missing fields | 422 `会员兑换需配置会员参数` | `applyEffectConfig` validation. |
| Discount config invalid time range | 422 `结束时间需晚于开始时间` | Reused validator for both code window and discount window. |
