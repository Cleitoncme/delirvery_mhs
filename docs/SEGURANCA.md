# Segurança e limites

Protótipo exclusivamente mock, independente de CRM. Não é um serviço de produção.

- React escapa texto; sem HTML arbitrário, scripts externos ou credenciais.
- CSP com nonce por requisição; scripts sem unsafe-inline em produção. Estilos inline permitidos para compatibilidade com componentes. `unsafe-eval` somente em desenvolvimento.
- Cabeçalhos anti-framing, nosniff, política de referência e bloqueio de sensores.
- Dados pessoais apenas na memória da aba. Carrinho persistido é entrada não confiável e deve ser validado.
- Valores inteiros e limites de quantidade; validação das opções contra catálogo e tenant.
- Nenhuma credencial `X-Token` no frontend. Conector futuro deverá ser server-only.
- PostgreSQL local é publicado somente em `127.0.0.1`. O container roda sem privilégios adicionais e os dados persistem em volume Docker.
- Antes de produção: autenticação e autorização por tenant/objeto, RBAC, sessões HttpOnly/Secure/SameSite, CSRF quando aplicável, rate limit, auditoria sem PII, retenção/consentimento, HTTPS/HSTS, backup, pagamentos idempotentes e testes de isolamento no banco/API.

Referência de configuração: https://nextjs.org/docs/app/guides/content-security-policy e https://nextjs.org/docs/app/api-reference/config/next-config-js/headers.
