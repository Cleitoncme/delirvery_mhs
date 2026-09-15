ALTER TABLE categories ADD COLUMN version integer NOT NULL DEFAULT 1;

ALTER TABLE products ADD COLUMN version integer NOT NULL DEFAULT 1;

ALTER TABLE product_option_groups
ADD COLUMN version integer NOT NULL DEFAULT 1;

ALTER TABLE product_options
ADD COLUMN version integer NOT NULL DEFAULT 1;