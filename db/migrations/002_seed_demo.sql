INSERT INTO tenants (id, slug, name, opening_hours_label, delivery_fee_cents)
VALUES ('00000000-0000-4000-8000-000000000001', 'mhs-mercado', 'MHS Mercado', '08:00 às 22:00', 500);

INSERT INTO categories (id, tenant_id, slug, name, icon, sort_order) VALUES
('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001','bebidas','Bebidas','wine',1),
('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000001','alimentos','Alimentos','wheat',2),
('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000001','higiene','Higiene','heart',3),
('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000001','limpeza','Limpeza','sparkles',4);

INSERT INTO products (id,tenant_id,category_id,slug,subcategory,name,description,price_cents,compare_at_price_cents,unit,available,featured,illustration,stock_quantity) VALUES
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','coca-cola-2l','Refrigerantes','Coca-Cola 2L','O sabor clássico para compartilhar. Refrigerante de cola, garrafa de 2 litros.',1290,1490,'un',true,true,'cola',30),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','coca-cola-lata','Refrigerantes','Coca-Cola Lata 350ml','Seu refrigerante favorito na medida certa.',450,NULL,'un',true,false,'can',48),
('00000000-0000-4000-8000-000000001003','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','guarana-2l','Refrigerantes','Guaraná Antarctica 2L','Refrigerante de guaraná para acompanhar suas refeições.',1190,NULL,'un',true,true,'green',20),
('00000000-0000-4000-8000-000000001004','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','agua-500ml','Águas','Água Mineral 500ml','Água mineral natural sem gás.',250,NULL,'un',true,false,'water',100),
('00000000-0000-4000-8000-000000001005','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','heineken-330ml','Cervejas','Cerveja Heineken 330ml','Produto indisponível nesta demonstração.',590,NULL,'un',false,false,'green',0),
('00000000-0000-4000-8000-000000001006','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','arroz-5kg','Mercearia','Arroz Tipo 1 5kg','Arroz branco tipo 1. Soltinho, versátil e ideal para o dia a dia.',2890,NULL,'pct',true,true,'rice',18),
('00000000-0000-4000-8000-000000001007','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','leite-1l','Laticínios','Leite Integral 1L','Leite integral UHT. Nutrição para começar bem o dia.',499,NULL,'un',true,true,'milk',32),
('00000000-0000-4000-8000-000000001008','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000103','sabonete','Cuidados pessoais','Sabonete Suave 90g','Cuidado e suavidade para sua rotina.',299,NULL,'un',true,true,'soap',24),
('00000000-0000-4000-8000-000000001009','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000104','detergente','Cozinha','Detergente Neutro 500ml','Limpeza prática para a cozinha.',279,NULL,'un',true,true,'clean',40),
('00000000-0000-4000-8000-000000001010','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','kit-lanche','Lanches','Kit Lanche','Monte seu lanche escolhendo a bebida.',1500,NULL,'kit',true,false,'rice',10);

INSERT INTO product_option_groups (id,tenant_id,product_id,name,required,min_selections,max_selections) VALUES
('00000000-0000-4000-8000-000000002001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000001010','Escolha sua bebida',true,1,1);
INSERT INTO product_options (id,tenant_id,option_group_id,name,additional_price_cents,stock_quantity) VALUES
('00000000-0000-4000-8000-000000002101','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000002001','Água mineral',0,20),
('00000000-0000-4000-8000-000000002102','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000002001','Coca-Cola lata',200,20);
