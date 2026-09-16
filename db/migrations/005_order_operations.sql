ALTER TABLE order_status_history ADD COLUMN reason varchar(500);
CREATE INDEX orders_tenant_customer_idx ON orders (tenant_id, customer_id, created_at DESC);
