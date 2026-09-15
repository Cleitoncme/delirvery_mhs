# Segurança e limites

Aplicação em desenvolvimento com PostgreSQL local, independente de CRM. Pagamentos continuam simulados.

- React escapa texto; sem HTML arbitrário, scripts externos ou credenciais.
- CSP com nonce por requisição; scripts sem unsafe-inline em produção. Estilos inline permitidos para compatibilidade com componentes. `unsafe-eval` somente em desenvolvimento.
- Cabeçalhos anti-framing, nosniff, política de referência e bloqueio de sensores.
- Dados de pedidos e clientes ficam no PostgreSQL. O navegador persiste apenas o carrinho validado e cookies de acesso HttpOnly; os dados pessoais não vão para localStorage.
- Valores inteiros e limites de quantidade; validação das opções contra catálogo e tenant.
- Nenhuma credencial `X-Token` no frontend. Conector futuro deverá ser server-only.
- PostgreSQL local é publicado somente em `127.0.0.1`. O container roda sem privilégios adicionais e os dados persistem em volume Docker.
- Admin: senhas com scrypt e salt aleatório; sessões opacas de 256 bits, com hash SHA-256 no banco, expiração em oito horas e revogação no logout. Cookie HttpOnly/SameSite=Strict e Secure em produção. Usuários desativados ou sessões expiradas são rejeitados a cada acesso.
- Perfis OPERATOR (consulta/avanço) e VIEWER (consulta). A loja vem da sessão validada, nunca de um tenantId enviado pelo navegador. Mudanças exigem origem exata em APP_ORIGIN, status esperado e transição permitida.
- Transições usam bloqueio de linha e transação: status, histórico com actor_id e evento de integração são gravados juntos. Um pedido para retirada não passa por saída para entrega. Cancelamento não é uma operação implementada nesta etapa.
- Login limitado no PostgreSQL a 10 tentativas por conta/loja e 100 no total a cada janela de 15 minutos. O limite global também pode bloquear logins legítimos sob ataque; revisar política e proteção na borda antes de exposição pública.
- Acompanhamento exige cookie aleatório restrito à rota do pedido, válido por sete dias, cujo hash fica em order_access. Nenhum telefone/endereço é retornado por esse endpoint. Pedido antigo sem cookie não é liberado apenas pelo UUID. Uma repetição autorizada da criação pela mesma Idempotency-Key pode emitir novo cookie.
- Antes de produção: revisão de autenticação, recuperação/rotação de senhas e MFA, proteção contra abuso na criação pública de pedidos, retenção de dados, limpeza de sessões/acessos expirados, HTTPS/HSTS, backups, usuário de banco com permissões mínimas e integração real de pagamentos. A criação pública não verifica a identidade do cliente.

Referência de configuração: https://nextjs.org/docs/app/guides/content-security-policy e https://nextjs.org/docs/app/api-reference/config/next-config-js/headers.
