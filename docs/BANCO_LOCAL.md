# PostgreSQL local

O PostgreSQL existe somente no Docker e a porta é ligada a `127.0.0.1`; não fica acessível pela rede local.

1. Copie `.env.example` para `.env` e troque `POSTGRES_PASSWORD` e a senha correspondente em `DATABASE_URL`.
2. Execute `npm run db:up`.
3. Aguarde o healthcheck: `docker compose ps` deve indicar `healthy`.

Na primeira inicialização do volume `postgres_data`, o container executa em ordem os arquivos em `db/migrations/`. A migration `001` cria o schema e a `002` insere exclusivamente o tenant demonstrativo `mhs-mercado`, categorias, produtos e complementos.

As migrations são imutáveis. Em ambientes já existentes, novas alterações devem ser um novo arquivo numerado. Para produção, a aplicação deverá executar migrations por um job restrito, sem expor a porta do banco.

A migration `003_admin_sessions.sql` adiciona usuários administrativos, sessões, limite de login, acessos privados de acompanhamento e identificação do operador no histórico. Para aplicar em volume existente e criar o primeiro operador, veja [ADMIN_LOCAL.md](ADMIN_LOCAL.md).

Para parar o container sem apagar dados, execute `npm run db:down`.
