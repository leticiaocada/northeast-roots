# Raízes do Nordeste - API

API back-end da rede de restaurantes **Raízes do Nordeste**, desenvolvida para o Projeto Multidisciplinar (Trilha Back-End) da UNINTER.

A API atende a vários canais (APP, TOTEM, BALCAO, PICKUP, WEB) e cobre cadastro e autenticação com perfis, unidades, cardápio por unidade, estoque por unidade, pedidos, pagamento simulado (mock), atualização de status, programa de fidelidade, promoções, LGPD e auditoria.

**Fluxo crítico implementado (Fluxo A):** Pedido → Pagamento mock → Atualização de status.

## Links

| Item | Onde |
|---|---|
| Repositório | https://github.com/leticiaocada/northeast-roots |
| Swagger local | http://localhost:3000/docs |
| Contrato OpenAPI (JSON) | http://localhost:3000/docs.json |
| Coleção Postman | [`postman/raizes-do-nordeste.postman_collection.json`](postman/raizes-do-nordeste.postman_collection.json) |
| DER | [`docs/der.md`](docs/der.md) - imagem: [`docs/imagens/der.png`](docs/imagens/der.png) |
| Casos de uso | [`docs/casos-de-uso.md`](docs/casos-de-uso.md) - imagem: [`docs/imagens/casos-de-uso.png`](docs/imagens/casos-de-uso.png) |
| Diagrama de classes | [`docs/diagrama-classes.md`](docs/diagrama-classes.md) - imagem: [`docs/imagens/diagrama-classes.png`](docs/imagens/diagrama-classes.png) |
| Diagrama de sequência | [`docs/diagrama-sequencia.md`](docs/diagrama-sequencia.md) - imagem: [`docs/imagens/diagrama-sequencia.png`](docs/imagens/diagrama-sequencia.png) |
| Arquitetura | [`docs/arquitetura.md`](docs/arquitetura.md) - imagem: [`docs/imagens/arquitetura.png`](docs/imagens/arquitetura.png) |
| Requisitos e priorização | [`docs/requisitos.md`](docs/requisitos.md) |
| Endpoints | [`docs/endpoints.md`](docs/endpoints.md) |
| LGPD e segurança | [`docs/lgpd-seguranca.md`](docs/lgpd-seguranca.md) |
| Plano de testes | [`docs/plano-de-testes.md`](docs/plano-de-testes.md) |

## Requisitos

| Ferramenta | Versão |
|---|---|
| Node.js | 22 ou superior |
| npm | 10 ou superior |
| PostgreSQL | 16 (ou usar o do Docker Compose) |
| Docker e Docker Compose | Opcional, para subir tudo com um comando |

Principais dependências: Express 5, Prisma 6, zod, jsonwebtoken, bcryptjs, helmet, express-rate-limit, swagger-ui-express e Jest.

## Opção 1: rodar com Docker (mais simples)

```bash
docker compose up --build
```

O Compose sobe o PostgreSQL, aplica as migrations, roda o seed e inicia a API em `http://localhost:3000`. O seed só é aplicado na primeira vez. Para começar do zero, remova o volume com `docker compose down -v`.

## Opção 2: rodar localmente

### 1. Variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta da API | `3000` |
| `DATABASE_URL` | Conexão com o PostgreSQL | `postgresql://postgres:postgres@localhost:5432/raizes_nordeste?schema=public` |
| `JWT_SECRET` | Segredo de assinatura do token. Troque em produção | `uma-chave-grande-e-secreta` |
| `JWT_EXPIRES_IN` | Validade do token em segundos | `3600` |

### 2. Banco de dados

Use um PostgreSQL local ou suba só o banco do Compose:

```bash
docker compose up -d banco
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Criar as tabelas (migrations) e popular o banco (seed)

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Iniciar a API

```bash
npm run dev
```

Para produção:

```bash
npm run build
npm start
```

Confira se a API está no ar em `GET http://localhost:3000/health`.

## Documentação (Swagger)

Com a API rodando, acesse **http://localhost:3000/docs**.

Para testar rotas protegidas no Swagger:

1. Execute `POST /auth/login` com um dos usuários abaixo.
2. Copie o `accessToken`.
3. Clique em **Authorize** e cole o token.

## Usuários do seed

Todos usam a senha **`Senha@123`**.

| Perfil | E-mail | Unidade |
|---|---|---|
| ADMIN | admin@raizesdonordeste.com.br | Todas |
| GERENTE | gerente.recife@raizesdonordeste.com.br | 1 - Recife |
| ATENDENTE | atendente.recife@raizesdonordeste.com.br | 1 - Recife |
| COZINHA | cozinha.recife@raizesdonordeste.com.br | 1 - Recife |
| GERENTE | gerente.fortaleza@raizesdonordeste.com.br | 2 - Fortaleza |
| CLIENTE | maria@cliente.com.br | Com consentimento e 150 pontos |
| CLIENTE | joao@cliente.com.br | Sem consentimento de fidelidade |

O seed também cria 3 unidades (Recife, Fortaleza e Salvador), 8 produtos com estoque por unidade e 2 promoções. A Moqueca de Peixe (produto 6) tem só 3 unidades em Recife, para testar o estoque insuficiente.

## Como rodar os testes

### Coleção Postman (testes da API)

1. Suba a API com o seed aplicado.
2. Importe `postman/raizes-do-nordeste.postman_collection.json` no Postman.
3. A variável da coleção `baseUrl` já vem como `http://localhost:3000`.
4. Use **Run collection** e execute as pastas **na ordem** (01 a 11):
   - `01 - Auth` faz login com cada perfil e salva os tokens nas variáveis da coleção. Não é preciso copiar token manualmente.
   - `06 - Pedidos` cria o pedido e salva o `pedidoId`, usado em `07 - Pagamentos` e `08 - Status do Pedido`.
5. Cada requisição tem testes automáticos de status code e de trechos do response.

Pelo terminal, com o newman:

```bash
npx newman run postman/raizes-do-nordeste.postman_collection.json
```

Os 31 cenários (T01 a T31) estão descritos em [`docs/plano-de-testes.md`](docs/plano-de-testes.md).

### Testes automatizados (unitários)

```bash
npm test
```

Testam as regras de domínio: transições de status, cálculo de valores, fidelidade, promoções e estoque.

## Fluxo principal passo a passo

1. `POST /auth/login` como cliente → token.
2. `GET /unidades/1/cardapio` → produtos disponíveis.
3. `POST /pedidos` com `canalPedido` → pedido `AGUARDANDO_PAGAMENTO`.
4. `POST /pagamentos` com `simulacao: APROVAR` → pagamento `APROVADO` e pedido `RECEBIDO`. Com `RECUSAR` o retorno é 402 e o pedido continua aguardando. Com `FALHAR` o retorno é 503.
5. `PATCH /pedidos/{id}/status` como cozinha → `EM_PREPARO` → `PRONTO`.
6. `PATCH /pedidos/{id}/status` como atendente → `ENTREGUE`.
7. `GET /auditoria?entidade=pedido&entidadeId={id}` como admin → histórico das ações.

## Padrão de erro

Todas as falhas retornam o mesmo formato:

```json
{
  "error": "ESTOQUE_INSUFICIENTE",
  "message": "Não há quantidade suficiente para um ou mais itens.",
  "details": [{ "field": "itens[0].quantidade", "issue": "Disponível: 3" }],
  "timestamp": "2026-10-12T12:00:00.000Z",
  "path": "/pedidos",
  "requestId": "4f1c2a7e-0d7b-4a52-9a4e-2f3c0e9b1a11"
}
```

## Estrutura do projeto

```
src/
  domain/           regras de negócio, enums e erro de aplicação
  application/      services (casos de uso), permissões e paginação
  infrastructure/   Prisma, repositórios, gateway de pagamento mock, segurança, logger
  api/              rotas, controllers, validações, middlewares e Swagger
prisma/             schema, migrations e seed
tests/              testes unitários (Jest)
postman/            coleção de testes da API
docs/               documentação técnica e diagramas
```

Detalhes em [`docs/arquitetura.md`](docs/arquitetura.md).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a API em modo desenvolvimento |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Inicia a versão compilada |
| `npm test` | Roda os testes unitários |
| `npm run prisma:deploy` | Aplica as migrations |
| `npm run prisma:seed` | Popula o banco |
| `npm run prisma:migrate` | Cria uma nova migration (desenvolvimento) |
