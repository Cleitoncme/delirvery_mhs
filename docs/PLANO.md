# Delivery MHS — plano e revisão

Escopo autorizado: implementar o protótipo da especificação fornecida, com revisão e segurança prioritária. Sem cobrança, envio de mensagens ou publicação.

Branches encadeadas, cada uma baseada na fase anterior:

1. `etapa/01-fundacao`: Next.js, TypeScript estrito, Tailwind, tokens, cabeçalhos e CSP.
2. `etapa/02-catalogo`: tipos, mocks por tenant, catálogo, busca, categorias e navegação.
3. `etapa/03-carrinho`: detalhes, complementos, Zustand e persistência validada.
4. `etapa/04-checkout`: identificação, entrega, pagamento e criação de pedido mock.
5. `etapa/05-pedidos-conta`: sucesso, acompanhamento e conta em memória.
6. `etapa/06-admin`: painel demonstrativo, Kanban, transições e validação integrada.
7. `etapa/07-api-postgres`: PostgreSQL local via Docker, schema multi-tenant e seed do catálogo demonstrativo.
8. `etapa/08-api-postgres`: conexão server-side, health check, catálogo público e criação idempotente de pedidos.
9. `etapa/09-cliente-api`: telas públicas carregadas do PostgreSQL e checkout integrado à criação segura de pedidos.

Cada branch preserva um checkpoint. Não fazer merge em develop nem push sem necessidade. Para revisar, comparar cada branch com sua antecessora.

O banco possui schema e dados de demonstração. As páginas server-side carregam o catálogo diretamente do PostgreSQL e o checkout envia o pedido à API. Os mocks restantes servem apenas de fixture para testes unitários.

## Correções à especificação

- Dinheiro em centavos inteiros, incluindo complementos. No exemplo original, 12,90 + 28,90 + 2 × 4,99 = 51,78: são quatro unidades e três linhas; distinguir os dois contadores.
- Categorias, produtos, carrinhos e pedidos devem carregar tenantId; resolução de tenant deve rejeitar slugs desconhecidos.
- Persistir somente IDs, quantidades e opções do carrinho; nunca cliente, endereço, telefone, token ou valores confiados do navegador.
- Preços são recalculados no servidor, com estoque, horário, taxas e idempotência. Produção ainda requer autenticação e autorização.
- Identificar por telefone não autentica. Conta e painel são demonstrações sem identidade verificada. Nenhuma informação real deve ser inserida.
- PIX é somente uma opção simulada; não gerar cobrança ou indicar pagamento confirmado.
- Pedidos em memória se perdem ao recarregar. IDs aleatórios não substituem autorização.
- Admin em produção fica desabilitado por padrão; habilitação explícita serve apenas para demonstrar dados fictícios. Antes de dados reais: autenticação, RBAC e isolamento server-side obrigatórios.
- A paleta é fornecida, mas nenhum arquivo de logo/layout aprovado foi anexado. Usar marca tipográfica provisória e ilustrações locais simples.

## Validação

Rodar TypeScript, ESLint e build em cada checkpoint; testar regras críticas e fluxo em navegador ao integrar. Registrar resultados reais, sem presumir testes visuais executados.
