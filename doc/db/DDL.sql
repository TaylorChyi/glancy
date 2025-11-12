-- glancy 数据库 DDL（PostgreSQL 14+）
-- 依据 SRS 第 10、11 章的配额与订阅约束，所有时间字段使用 UTC。

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id         TEXT,
    email               TEXT,
    locale              TEXT NOT NULL DEFAULT 'zh-CN',
    time_zone           TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','pending','deleted')),
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_external_id_uq ON users(external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (LOWER(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id             TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    level               SMALLINT NOT NULL,
    entitlements        JSONB NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_prices (
    price_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id             TEXT NOT NULL REFERENCES subscription_plans(plan_id),
    period              TEXT NOT NULL CHECK (period IN ('monthly','yearly')),
    currency            CHAR(3) NOT NULL,
    amount_cents        BIGINT NOT NULL CHECK (amount_cents > 0),
    store_product_id    TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_prices_plan_period_currency_uq
    ON subscription_prices(plan_id, period, currency)
    WHERE is_active;

CREATE TABLE IF NOT EXISTS subscriptions (
    sub_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id),
    plan_id                 TEXT NOT NULL REFERENCES subscription_plans(plan_id),
    price_id                UUID REFERENCES subscription_prices(price_id),
    status                  TEXT NOT NULL CHECK (status IN (
        'NONE','TRIALING','ACTIVE','GRACE','PAST_DUE','CANCELED','EXPIRED','REVOKED','REFUNDED'
    )),
    start_at                TIMESTAMPTZ NOT NULL,
    end_at                  TIMESTAMPTZ NOT NULL,
    trial_end_at            TIMESTAMPTZ,
    grace_until             TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
    auto_renew              BOOLEAN NOT NULL DEFAULT TRUE,
    source_channel          TEXT NOT NULL DEFAULT 'web',
    version                 BIGINT NOT NULL DEFAULT 1,
    deleted_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_active_user_uq
    ON subscriptions(user_id)
    WHERE status IN ('TRIALING','ACTIVE','GRACE');

CREATE TABLE IF NOT EXISTS entitlement_events (
    event_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id         UUID NOT NULL REFERENCES subscriptions(sub_id),
    plan_id                 TEXT NOT NULL REFERENCES subscription_plans(plan_id),
    subscription_version    BIGINT NOT NULL,
    plan_snapshot           JSONB NOT NULL,
    limits_snapshot         JSONB NOT NULL,
    event_type              TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed')),
    next_attempt_at         TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    trace_id                TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS entitlement_events_subscription_version_uq
    ON entitlement_events(subscription_id, subscription_version);

CREATE TABLE IF NOT EXISTS billing_orders (
    order_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    subscription_id     UUID REFERENCES subscriptions(sub_id),
    price_id            UUID NOT NULL REFERENCES subscription_prices(price_id),
    channel             TEXT NOT NULL,
    currency            CHAR(3) NOT NULL,
    amount_cents        BIGINT NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('pending','paid','failed','canceled','refunded')),
    idem_key            TEXT,
    coupon_code         TEXT,
    metadata            JSONB,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_orders_idem_key_uq
    ON billing_orders(idem_key) WHERE idem_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS billing_transactions (
    txn_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES billing_orders(order_id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES subscriptions(sub_id),
    platform_txn_id     TEXT,
    idem_key            TEXT NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed','chargeback','refunded')),
    paid_at             TIMESTAMPTZ,
    raw_callback        JSONB,
    failure_reason      TEXT,
    trace_id            TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_transactions_platform_txn_uq
    ON billing_transactions(platform_txn_id) WHERE platform_txn_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS billing_transactions_idem_key_uq
    ON billing_transactions(idem_key);

CREATE TABLE IF NOT EXISTS billing_invoices (
    invoice_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES billing_orders(order_id) ON DELETE CASCADE,
    amount_cents        BIGINT NOT NULL,
    tax_cents           BIGINT NOT NULL DEFAULT 0,
    discount_cents      BIGINT NOT NULL DEFAULT 0,
    receipt_url         TEXT,
    receipt_expires_at  TIMESTAMPTZ,
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_invoices_order_uq ON billing_invoices(order_id);

CREATE TABLE IF NOT EXISTS quota_daily (
    quota_daily_id      BIGSERIAL PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id),
    metric              TEXT NOT NULL CHECK (metric IN ('lookup','regenerate')),
    quota_date_local    DATE NOT NULL,
    time_zone           TEXT NOT NULL,
    limit_value         INTEGER NOT NULL,
    promo_value         INTEGER NOT NULL DEFAULT 0,
    used_value          INTEGER NOT NULL DEFAULT 0,
    reset_at_local      TIMESTAMPTZ NOT NULL,
    last_reconciled_at  TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS quota_daily_user_date_metric_uq
    ON quota_daily(user_id, quota_date_local, metric)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS quota_ledger (
    entry_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quota_daily_id      BIGINT REFERENCES quota_daily(quota_daily_id),
    user_id             UUID NOT NULL REFERENCES users(id),
    subscription_id     UUID REFERENCES subscriptions(sub_id),
    metric              TEXT NOT NULL CHECK (metric IN ('lookup','regenerate','promo')),
    quota_date_local    DATE NOT NULL,
    delta               INTEGER NOT NULL,
    reason              TEXT NOT NULL CHECK (reason IN ('usage','rollback','promo_grant','manual_adjust')),
    idempotency_key     TEXT NOT NULL,
    trace_id            TEXT,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS quota_ledger_idem_key_uq ON quota_ledger(idempotency_key);
CREATE INDEX IF NOT EXISTS quota_ledger_user_date_idx ON quota_ledger(user_id, quota_date_local DESC);

CREATE TABLE IF NOT EXISTS lexicon_records (
    record_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    entry_text          TEXT NOT NULL,
    entry_hash          TEXT NOT NULL,
    entry_language      TEXT NOT NULL,
    origin              TEXT NOT NULL CHECK (origin IN ('lookup','regenerate')),
    result_version      TEXT,
    result_payload      JSONB,
    cost_in_tokens      INTEGER NOT NULL DEFAULT 0,
    cost_out_tokens     INTEGER NOT NULL DEFAULT 0,
    quota_entry_id      UUID REFERENCES quota_ledger(entry_id),
    is_degraded         BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lexicon_records_user_created_idx ON lexicon_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lexicon_records_entry_hash_idx ON lexicon_records(entry_hash);

CREATE TABLE IF NOT EXISTS export_jobs (
    job_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    job_type            TEXT NOT NULL CHECK (job_type IN ('lexicon_export','quota_export','billing_export')),
    status              TEXT NOT NULL CHECK (status IN ('pending','running','succeeded','failed','expired','canceled')),
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execute_after       TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    filters             JSONB,
    result_uri          TEXT,
    error_message       TEXT,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS export_jobs_status_idx ON export_jobs(status, execute_after);
CREATE INDEX IF NOT EXISTS export_jobs_user_idx ON export_jobs(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id              BIGSERIAL PRIMARY KEY,
    actor_id            UUID REFERENCES users(id),
    actor_type          TEXT NOT NULL DEFAULT 'user',
    scope               TEXT NOT NULL,
    action              TEXT NOT NULL,
    resource_type       TEXT,
    resource_id         TEXT,
    before_state        JSONB,
    after_state         JSONB,
    ip_address          INET,
    user_agent          TEXT,
    trace_id            TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_scope_created_idx ON audit_logs(scope, created_at DESC);

-- 清理作业视图：提供 T+7 物理清理所需的数据集
CREATE MATERIALIZED VIEW IF NOT EXISTS cleanup_candidates AS
SELECT 'users' AS table_name, id::TEXT AS pk, deleted_at
FROM users WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'subscriptions', sub_id::TEXT, deleted_at FROM subscriptions WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'billing_orders', order_id::TEXT, deleted_at FROM billing_orders WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'billing_invoices', invoice_id::TEXT, deleted_at FROM billing_invoices WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'lexicon_records', record_id::TEXT, deleted_at FROM lexicon_records WHERE deleted_at IS NOT NULL
UNION ALL
SELECT 'export_jobs', job_id::TEXT, deleted_at FROM export_jobs WHERE deleted_at IS NOT NULL;
