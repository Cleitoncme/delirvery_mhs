CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email varchar(254) NOT NULL,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('OPERATOR', 'VIEWER')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email),
  UNIQUE (id, tenant_id)
);
CREATE TABLE admin_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_sessions_expiry_idx ON admin_sessions(expires_at);
CREATE TABLE admin_login_limits (
  key_hash char(64) PRIMARY KEY,
  attempts integer NOT NULL,
  resets_at timestamptz NOT NULL
);
CREATE TABLE order_access (
  token_hash char(64) PRIMARY KEY,
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (order_id, tenant_id) REFERENCES orders(id, tenant_id) ON DELETE CASCADE
);
CREATE INDEX order_access_expiry_idx ON order_access(expires_at);
ALTER TABLE order_status_history ADD COLUMN actor_id uuid;
ALTER TABLE order_status_history ADD CONSTRAINT history_admin_tenant_fk
  FOREIGN KEY (actor_id, tenant_id) REFERENCES admin_users(id, tenant_id);
