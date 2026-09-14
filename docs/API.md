# API local

Todos os endpoints são same-origin, executam no runtime Node.js e usam `DATABASE_URL` exclusivamente no servidor.

## Health check

`GET /api/health` verifica a conexão com PostgreSQL e responde `{"status":"ok"}`.

## Catálogo

`GET /api/v1/lojas/mhs-mercado/catalogo` devolve tenant, categorias, produtos e complementos do PostgreSQL. Valores monetários são inteiros em centavos.

## Criar pedido

`POST /api/v1/lojas/mhs-mercado/pedidos`

Cabeçalhos obrigatórios:

```http
Content-Type: application/json
Idempotency-Key: UUID-v4
```

O corpo inclui `customer`, `fulfillment`, `payment`, `items` e, para entrega, `address`. Cada item usa o UUID retornado pelo catálogo, `quantity` entre 1 e 99 e os UUIDs de complementos selecionados.

O endpoint não aceita preço, taxa, desconto, estoque ou total enviados pelo cliente. Ele bloqueia os produtos selecionados, valida disponibilidade e complementos, calcula o total no PostgreSQL, grava o histórico `NEW` e cria um evento `ORDER_CREATED` na outbox `integration_events`. A mesma chave retorna o pedido existente, sem criar uma segunda venda.

Ainda não há autenticação de cliente nem administrativo. A API está limitada ao ambiente de desenvolvimento e deve receber autenticação, RBAC, rate limit, proteção contra abuso e worker para a outbox antes de produção.
