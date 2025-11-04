--
-- 背景：
--  - 新增线下发放的兑换码，用于为抢先体验用户延长 PLUS 会员资格。
-- 目的：
--  - 以 SQL 方式落库兑换码配置，便于在无后端发布的情况下快速生效。
-- 关键决策与取舍：
--  - 使用 TIMESTAMPDIFF 计算小时数，避免手算跨年日历差异；
--  - 单用户额度与总额度保持一致，以“无限次”语义映射到配额模型；
--  - 按 SpringPhysicalNamingStrategy 约定使用下划线命名，保证与实体映射一致。
-- 影响范围：
--  - redemption_code 表新增一条记录，被兑换服务读取后即刻可用。
-- 演进与TODO：
--  - 若后续需要精确到指定绝对到期时间，可考虑在会员策略中支持绝对时间配置。
--
INSERT INTO redemption_code (
    code,
    redeemable_from,
    redeemable_until,
    total_quota,
    per_user_quota,
    total_redeemed,
    effect_type,
    membership_type,
    membership_extension_hours,
    discount_percentage,
    discount_valid_from,
    discount_valid_until,
    version,
    deleted,
    created_at,
    updated_at
)
SELECT
    'PLUS20251007',
    '2024-10-07 00:00:00',
    '2025-10-07 23:59:59',
    99,
    99,
    0,
    'MEMBERSHIP',
    'PLUS',
    TIMESTAMPDIFF(HOUR, '2024-10-07 00:00:00', '2025-10-07 00:00:00'),
    NULL,
    NULL,
    NULL,
    0,
    FALSE,
    NOW(6),
    NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM redemption_code WHERE code = 'PLUS20251007'
);
