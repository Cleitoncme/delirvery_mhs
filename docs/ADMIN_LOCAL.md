# Painel administrativo — etapa 10

O painel usa os pedidos reais do PostgreSQL local. Não existe senha padrão nem conta administrativa criada pelo seed.

## Banco já existente

A migration 003 foi aplicada no ambiente local desta etapa. Em outra instalação que já tenha as migrations 001 e 002, execute **uma vez**, sem apagar o volume:

```powershell
docker compose exec -T postgres psql -U delivery_mhs -d delivery_mhs -v ON_ERROR_STOP=1 --single-transaction -f /docker-entrypoint-initdb.d/003_admin_sessions.sql
```

Se os nomes de usuário/banco em `.env` forem diferentes, ajuste `-U` e `-d`. Volumes novos recebem as três migrations automaticamente no primeiro boot. Não reaplique 003 se `admin_users` já existir.

## Primeiro acesso

1. No `.env`, defina `ADMIN_ENABLED=true` e `APP_ORIGIN=http://127.0.0.1:3000`.
2. Crie um operador, substituindo o e-mail pelo desejado:

```powershell
npm run admin:create -- mhs-mercado operador@example.com
```

O comando gera uma senha aleatória e a exibe uma vez no terminal. Guarde-a em um gerenciador de senhas. A senha não é gravada em texto puro no banco; o comando não substitui contas existentes. É possível fornecer uma senha de 16 a 256 caracteres pela variável de ambiente `ADMIN_PASSWORD`, sem colocá-la nos argumentos do comando.

3. Reinicie `npm run dev` e acesse `http://127.0.0.1:3000/admin`. Informe loja, e-mail e senha.
4. Para usuário somente de consulta, acrescente `VIEWER` ao comando de criação.

O acesso fica desabilitado quando ADMIN_ENABLED não é `true`. Produção exige origem HTTPS explícita e cookies Secure; não basta publicar esta configuração local na VPS.

## Verificação

`npm run test:e2e -- --workers=1` inicia um servidor próprio com admin habilitado somente no processo de testes. Encerre seu servidor da porta 3000 antes. Os testes administrativos criam lojas e contas isoladas e removem seus registros ao terminar. Cobrem login/logout, dois perfis, isolamento, origem externa, expiração, usuário desativado, concorrência, histórico, entrega/retirada e acompanhamento após recarregar.

Os demais testes de API/checkout continuam usando o catálogo demonstrativo. Não execute a suíte contra banco com dados de produção.

Validação deste checkpoint: TypeScript, ESLint, build de produção e seis testes unitários aprovados; 12 cenários administrativos em desktop/mobile aprovados, além dos 12 cenários existentes de API, checkout, carrinho, catálogo e fundação. A compilação inicial do servidor de desenvolvimento excedeu os prazos iniciais; os testes administrativos passaram após adequar esses prazos e verificar a API antes de abrir o acompanhamento. O bloqueio com ADMIN_ENABLED=false foi conferido no servidor de produção local, e o comando de criação de operador foi exercitado com uma conta temporária removida ao final.

## Limites desta etapa

O acompanhamento pertence ao navegador que fez a compra e expira em sete dias. Pedidos anteriores a esta etapa não recebem acesso público retroativo; podem ser consultados pelo operador da loja. Recuperação de acesso em outro aparelho, MFA, recuperação de senha, cancelamento e consumo dos eventos por integrações são etapas futuras. O painel mostra páginas de 50 pedidos e a busca filtra a página atual.
