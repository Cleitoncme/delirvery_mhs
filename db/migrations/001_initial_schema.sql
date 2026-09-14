CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name varchar(160) NOT NULL,
  primary_color char(7) NOT NULL DEFAULT '#B3202A' CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_open boolean NOT NULL DEFAULT true,
  opening_hours_label varchar(120) NOT NULL,
  delivery_fee_cents integer NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug varchar(80) NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name varchar(100) NOT NULL,
  icon varchar(40),
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug),
  UNIQUE (id, tenant_id)
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL,
  external_id varchar(120),
  slug varchar(100) NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  subcategory varchar(100) NOT NULL,
  name varchar(180) NOT NULL,
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  compare_at_price_cents integer CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= price_cents),
  unit varchar(20) NOT NULL,
  available boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  illustration varchar(30),
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_category_tenant_fk FOREIGN KEY (category_id, tenant_id) REFERENCES categories(id, tenant_id),
  UNIQUE (tenant_id, slug),
  UNIQUE (id, tenant_id)
);

CREATE TABLE product_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  name varchar(120) NOT NULL,
  required boolean NOT NULL DEFAULT false,
  min_selections smallint NOT NULL DEFAULT 0 CHECK (min_selections >= 0),
  max_selections smallint NOT NULL CHECK (max_selections >= min_selections AND max_selections > 0),
  sort_order smallint NOT NULL DEFAULT 0,
  CONSTRAINT option_groups_product_tenant_fk FOREIGN KEY (product_id, tenant_id) REFERENCES products(id, tenant_id),
  UNIQUE (id, tenant_id)
);

CREATE TABLE product_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  option_group_id uuid NOT NULL,
  name varchar(120) NOT NULL,
  additional_price_cents integer NOT NULL DEFAULT 0 CHECK (additional_price_cents >= 0),
  available boolean NOT NULL DEFAULT true,
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  sort_order smallint NOT NULL DEFAULT 0,
  CONSTRAINT options_group_tenant_fk FOREIGN KEY (option_group_id, tenant_id) REFERENCES product_option_groups(id, tenant_id),
  UNIQUE (id, tenant_id)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(254),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, phone),
  UNIQUE (id, tenant_id)
);

CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  street varchar(100) NOT NULL,
  number varchar(20) NOT NULL,
  complement varchar(100),
  neighborhood varchar(80) NOT NULL,
  city varchar(80) NOT NULL,
  state char(2) NOT NULL,
  zip_code char(8) NOT NULL CHECK (zip_code ~ '^[0-9]{8}$'),
  reference varchar(160),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT addresses_customer_tenant_fk FOREIGN KEY (customer_id, tenant_id) REFERENCES customers(id, tenant_id),
  UNIQUE (id, tenant_id)
);

CREATE TYPE fulfillment_type AS ENUM ('DELIVERY', 'PICKUP');
CREATE TYPE payment_method AS ENUM ('PIX', 'CARD_ON_DELIVERY', 'CASH');
CREATE TYPE order_status AS ENUM ('NEW', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELED');

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  number bigint NOT NULL,
  customer_id uuid NOT NULL,
  address_id uuid,
  fulfillment fulfillment_type NOT NULL,
  payment payment_method NOT NULL,
  change_for_cents integer CHECK (change_for_cents IS NULL OR change_for_cents >= 0),
  notes varchar(500) NOT NULL DEFAULT '',
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents integer NOT NULL CHECK (delivery_fee_cents >= 0),
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  status order_status NOT NULL DEFAULT 'NEW',
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_customer_tenant_fk FOREIGN KEY (customer_id, tenant_id) REFERENCES customers(id, tenant_id),
  CONSTRAINT orders_address_tenant_fk FOREIGN KEY (address_id, tenant_id) REFERENCES addresses(id, tenant_id),
  CONSTRAINT orders_total_check CHECK (total_cents = subtotal_cents + delivery_fee_cents - discount_cents),
  CONSTRAINT orders_cash_change_check CHECK (payment <> 'CASH' OR change_for_cents IS NULL OR change_for_cents >= total_cents),
  UNIQUE (tenant_id, number),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (id, tenant_id)
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name varchar(180) NOT NULL,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity smallint NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  notes varchar(500),
  CONSTRAINT order_items_order_tenant_fk FOREIGN KEY (order_id, tenant_id) REFERENCES orders(id, tenant_id),
  CONSTRAINT order_items_product_tenant_fk FOREIGN KEY (product_id, tenant_id) REFERENCES products(id, tenant_id),
  CONSTRAINT order_items_total_check CHECK (total_cents = unit_price_cents * quantity),
  UNIQUE (id, tenant_id)
);

CREATE TABLE order_item_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  order_item_id uuid NOT NULL,
  product_option_id uuid NOT NULL,
  option_name varchar(120) NOT NULL,
  additional_price_cents integer NOT NULL CHECK (additional_price_cents >= 0),
  CONSTRAINT order_item_options_item_tenant_fk FOREIGN KEY (order_item_id, tenant_id) REFERENCES order_items(id, tenant_id),
  CONSTRAINT order_item_options_option_tenant_fk FOREIGN KEY (product_option_id, tenant_id) REFERENCES product_options(id, tenant_id)
);

CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL,
  status order_status NOT NULL,
  actor_type varchar(30) NOT NULL DEFAULT 'SYSTEM',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT history_order_tenant_fk FOREIGN KEY (order_id, tenant_id) REFERENCES orders(id, tenant_id)
);

CREATE TABLE integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  aggregate_type varchar(40) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(80) NOT NULL,
  payload jsonb NOT NULL,
  idempotency_key uuid NOT NULL UNIQUE,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error varchar(500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_tenant_category_idx ON products (tenant_id, category_id) WHERE available;
CREATE INDEX orders_tenant_status_created_idx ON orders (tenant_id, status, created_at DESC);
CREATE INDEX integration_events_pending_idx ON integration_events (available_at) WHERE processed_at IS NULL;
