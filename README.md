# Raízes do Nordeste - API

API back-end da rede de restaurantes **Raízes do Nordeste**, desenvolvida para o Projeto Multidisciplinar (Trilha Back-End) da UNINTER.

## Tecnologias

- Node.js 22 ou superior
- TypeScript
- Express
- PostgreSQL 16
- Prisma ORM (migrations e seed)
- Docker e Docker Compose

## Como rodar com Docker

```bash
docker compose up --build
```

O compose sobe o PostgreSQL, aplica as migrations, roda o seed e inicia a API em `http://localhost:3000`.

## Como rodar localmente

1. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

2. Suba um PostgreSQL (pode ser só o banco do compose):

```bash
docker compose up -d banco
```

3. Instale as dependências, rode as migrations e o seed:

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
```

4. Inicie a API:

```bash
npm run dev
```

A rota `GET /health` pode ser usada para conferir se a API está no ar.
