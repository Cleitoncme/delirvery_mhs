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

A resposta de criação também emite um cookie HttpOnly para acompanhar aquele pedido durante sete dias. A chave de idempotência deve ser tratada como segredo da tentativa de compra: uma repetição com essa chave pode emitir outro acesso ao mesmo pedido.

## Acompanhamento

`GET /api/v1/lojas/[slug]/pedidos/[orderId]` exige o cookie emitido na criação. Retorna totais, itens, modalidade, status e histórico do banco. Não retorna telefone, e-mail ou endereço. Sem acesso válido, pedido de outra loja ou acesso expirado: 404. Cookies e dados não são compartilhados por cache. As telas consultam a cada dez segundos e sobrevivem ao recarregamento no mesmo navegador.

## Administrativo

- `POST /api/admin/session`: JSON `{ "slug": "mhs-mercado", "email": "operador@example.com", "password": "..." }`. Exige Origin igual a APP_ORIGIN. Emite sessão HttpOnly de oito horas; senha incorreta retorna 401 e limite de tentativas, 429.
- `DELETE /api/admin/session`: revoga sessão e remove cookie. Exige Origin.
- `GET /api/admin/pedidos?page=0`: até 50 pedidos da loja da sessão, ordenados do mais recente, com `hasMore` e `role`. Sem sessão: 401. Painel desabilitado: 503.
- `PATCH /api/admin/pedidos/[orderId]/status`: JSON `{ "expectedStatus": "NEW", "status": "PREPARING" }`. Exige sessão OPERATOR e Origin. Perfil VIEWER: 403; pedido de outra loja: 404; estado desatualizado ou transição inválida: 409.
- `GET /api/admin/pedidos?page=0&status=PREPARING&search=joao`: filtra por status e pesquisa por número, nome ou telefone. A busca continua limitada à loja da sessão e retorna no máximo 50 por página.
- `POST /api/admin/pedidos/[orderId]/cancel`: JSON `{ "reason": "Cliente solicitou cancelamento" }`. Exige sessão OPERATOR e Origin. Só permite pedidos `NEW`, `PREPARING` ou `READY`; devolve estoque controlado de produtos e complementos, grava motivo no histórico e cria evento de integração.

Entrega: NEW → PREPARING → READY → OUT_FOR_DELIVERY → COMPLETED. Retirada: NEW → PREPARING → READY → COMPLETED. Estados terminais não permitem avanço. Eventos ORDER_STATUS_CHANGED ficam na outbox; envio a integrações depende de um worker futuro.

Cancelamento: NEW/PREPARING/READY → CANCELED. Não há cancelamento após saída para entrega ou conclusão. A operação é atômica e não pode ser repetida.

Todas as entradas JSON são limitadas a 64 KiB durante a leitura, mesmo sem Content-Length. Veja [ADMIN_LOCAL.md](ADMIN_LOCAL.md) para configurar o primeiro acesso.
