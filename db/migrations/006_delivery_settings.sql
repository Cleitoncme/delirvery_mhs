ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS minimum_order_cents integer NOT NULL DEFAULT 0 CHECK (minimum_order_cents >= 0),
ADD COLUMN IF NOT EXISTS latitude numeric(9, 6),
ADD COLUMN IF NOT EXISTS longitude numeric(9, 6);

CREATE TABLE IF NOT EXISTS delivery_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    min_distance_m integer NOT NULL DEFAULT 0 CHECK (min_distance_m >= 0),
    max_distance_m integer NOT NULL CHECK (
        max_distance_m > min_distance_m
    ),
    fee_cents integer NOT NULL CHECK (fee_cents >= 0),
    active boolean NOT NULL DEFAULT true,
    sort_order smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (
        tenant_id,
        min_distance_m,
        max_distance_m
    )
);

UPDATE tenants
SET
    latitude = -27.100700,
    longitude = -52.615200
WHERE
    slug = 'mhs-mercado'
    AND latitude IS NULL;

INSERT INTO
    delivery_zones (
        tenant_id,
        min_distance_m,
        max_distance_m,
        fee_cents,
        sort_order
    )
SELECT id, 0, 2000, 400, 1
FROM tenants t
WHERE
    t.slug = 'mhs-mercado'
    AND NOT EXISTS (
        SELECT 1
        FROM delivery_zones z
        WHERE
            z.tenant_id = t.id
    );

INSERT INTO
    delivery_zones (
        tenant_id,
        min_distance_m,
        max_distance_m,
        fee_cents,
        sort_order
    )
SELECT id, 2000, 5000, 700, 2
FROM tenants t
WHERE
    t.slug = 'mhs-mercado'
    AND NOT EXISTS (
        SELECT 1
        FROM delivery_zones z
        WHERE
            z.tenant_id = t.id
            AND z.min_distance_m = 2000
    );

INSERT INTO
    delivery_zones (
        tenant_id,
        min_distance_m,
        max_distance_m,
        fee_cents,
        sort_order
    )
SELECT id, 5000, 8000, 1000, 3
FROM tenants t
WHERE
    t.slug = 'mhs-mercado'
    AND NOT EXISTS (
        SELECT 1
        FROM delivery_zones z
        WHERE
            z.tenant_id = t.id
            AND z.min_distance_m = 5000
    );

CREATE INDEX IF NOT EXISTS delivery_zones_tenant_active_idx ON delivery_zones (
    tenant_id,
    active,
    min_distance_m
);