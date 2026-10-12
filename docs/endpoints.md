# API e Endpoints

Base URL local: `http://localhost:3000`. Documentação interativa: `http://localhost:3000/docs` (Swagger). Contrato em JSON: `http://localhost:3000/docs.json`.

Autenticação: JWT no cabeçalho `Authorization: Bearer <token>`, obtido em `POST /auth/login`.

## Padrão de erro (todas as falhas)

```json
{
  "error": "NOME_DO_ERRO",
  "message": "Mensagem legível",
  "details": [{ "field": "campo", "issue": "problema" }],
  "timestamp": "2026-10-12T12:00:00.000Z",
  "path": "/rota",
  "requestId": "4f1c2a7e-0d7b-4a52-9a4e-2f3c0e9b1a11"
}
```

| Status | Uso |
|---|---|
| 200 | Consulta ou atualização com sucesso |
| 201 | Recurso criado (cadastro, pedido, pagamento aprovado, movimentação de estoque) |
| 204 | Sucesso sem conteúdo (desativação, anonimização) |
| 400 | JSON malformado (`JSON_INVALIDO`) |
| 401 | Sem token, token inválido ou credenciais inválidas |
| 402 | Pagamento recusado pelo gateway |
| 403 | Perfil sem permissão ou recurso de outra unidade/cliente |
| 404 | Recurso inexistente |
| 409 | Conflito com regra de negócio (estoque, transição de status, pedido já pago, pontos) |
| 422 | Erro de validação dos dados enviados (`VALIDACAO`) |
| 429 | Muitas tentativas de login |
| 503 | Gateway de pagamento indisponível |

## Resumo dos endpoints

| Recurso | Método e rota | Permissão | Finalidade |
|---|---|---|---|
| /auth | POST /auth/login | Público | Autenticar e obter token |
| /usuarios | POST /usuarios | Público | Cadastro de cliente com consentimento |
| | GET /usuarios/me | Autenticado | Dados do usuário logado |
| | DELETE /usuarios/me | CLIENTE | Anonimizar a conta (LGPD) |
| | GET /usuarios?page&limit | ADMIN | Listar usuários |
| | POST /usuarios/funcionarios | ADMIN | Cadastrar funcionário |
| /unidades | GET /unidades?page&limit | Público | Listar unidades |
| | GET /unidades/{id} | Público | Buscar unidade |
| | GET /unidades/{id}/cardapio | Público | Cardápio da unidade |
| | POST /unidades | ADMIN | Criar unidade |
| | PUT /unidades/{id} | ADMIN | Atualizar unidade |
| | DELETE /unidades/{id} | ADMIN | Desativar unidade |
| /produtos | GET /produtos?page&limit&categoria | Público | Listar produtos |
| | GET /produtos/{id} | Público | Buscar produto |
| | POST /produtos | ADMIN | Criar produto |
| | PUT /produtos/{id} | ADMIN | Atualizar produto |
| | DELETE /produtos/{id} | ADMIN | Desativar produto |
| /estoque | GET /estoque?unidadeId&page&limit | GERENTE (sua unidade), ADMIN | Saldo por unidade |
| | POST /estoque/entradas | GERENTE (sua unidade), ADMIN | Entrada de estoque |
| | POST /estoque/saidas | GERENTE (sua unidade), ADMIN | Saída de estoque |
| | GET /estoque/movimentacoes?unidadeId | GERENTE (sua unidade), ADMIN | Histórico de movimentações |
| /pedidos | POST /pedidos | CLIENTE, ATENDENTE, GERENTE, ADMIN | Criar pedido |
| | GET /pedidos?canalPedido&status&unidadeId&page&limit | Autenticado | Listar pedidos com filtros |
| | GET /pedidos/{id} | Dono do pedido ou funcionário da unidade | Consultar pedido |
| | PATCH /pedidos/{id}/status | COZINHA, ATENDENTE, GERENTE, ADMIN | Atualizar status |
| | PATCH /pedidos/{id}/cancelar | CLIENTE (dono), ATENDENTE, GERENTE, ADMIN | Cancelar pedido |
| /pagamentos | POST /pagamentos | CLIENTE (dono), ATENDENTE, GERENTE, ADMIN | Solicitar pagamento (mock) |
| | GET /pagamentos?pedidoId | CLIENTE (dono), ATENDENTE, GERENTE, ADMIN | Tentativas de pagamento |
| /fidelidade | GET /fidelidade/saldo | CLIENTE | Saldo de pontos |
| | GET /fidelidade/historico | CLIENTE | Histórico de pontos |
| | PATCH /fidelidade/consentimento | CLIENTE | Conceder/revogar consentimento |
| /promocoes | GET /promocoes | Público | Promoções vigentes |
| | POST /promocoes | ADMIN | Criar promoção |
| | PATCH /promocoes/{id}/desativar | ADMIN | Desativar promoção |
| /auditoria | GET /auditoria?entidade&entidadeId&acao | ADMIN | Logs de auditoria |

---

## /auth - Login

**Finalidade:** autenticar o usuário e retornar o token.
**Método/Rota:** `POST /auth/login`
**Auth/Permissão:** público

Request:

```json
{ "email": "maria@cliente.com.br", "senha": "Senha@123" }
```

Response 200:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { "id": 6, "nome": "Maria Cliente", "perfil": "CLIENTE", "unidadeId": null }
}
```

Status codes: 200, 401 (`CREDENCIAIS_INVALIDAS`), 422, 429.

---

## /pedidos - Criar pedido (fluxo crítico)

**Finalidade:** criar um pedido validando estoque da unidade, aplicando promoções e calculando o total.
**Método/Rota:** `POST /pedidos`
**Auth/Permissão:** JWT | CLIENTE, ATENDENTE, GERENTE, ADMIN

Request:

```json
{
  "unidadeId": 1,
  "canalPedido": "TOTEM",
  "formaPagamento": "MOCK",
  "itens": [
    { "produtoId": 1, "quantidade": 2 },
    { "produtoId": 2, "quantidade": 1 }
  ]
}
```

Campos opcionais: `clienteId` (usado pelo atendente no balcão), `observacao` e `pontosResgatados`.

Response 201:

```json
{
  "id": 1,
  "unidadeId": 1,
  "clienteId": 1,
  "canalPedido": "TOTEM",
  "status": "AGUARDANDO_PAGAMENTO",
  "formaPagamento": "MOCK",
  "subtotal": 129.7,
  "desconto": 0,
  "total": 129.7,
  "pontosUsados": 0,
  "observacao": null,
  "itens": [
    { "produtoId": 1, "nome": "Baião de Dois", "quantidade": 2, "precoUnitario": 39.9, "desconto": 0, "promocaoId": null },
    { "produtoId": 2, "nome": "Carne de Sol com Macaxeira", "quantidade": 1, "precoUnitario": 49.9, "desconto": 0, "promocaoId": null }
  ],
  "criadoPorId": 6,
  "criadoEm": "2026-10-12T12:00:00.000Z",
  "atualizadoEm": "2026-10-12T12:00:00.000Z"
}
```

Status codes: 201, 401, 403, 404 (unidade/produto), 409 (estoque/pontos), 422 (validação).

Erro 422 (sem canalPedido):

```json
{
  "error": "VALIDACAO",
  "message": "Os dados enviados são inválidos.",
  "details": [{ "field": "canalPedido", "issue": "canalPedido é obrigatório. Valores aceitos: APP, TOTEM, BALCAO, PICKUP, WEB." }],
  "timestamp": "2026-10-12T12:00:00.000Z",
  "path": "/pedidos",
  "requestId": "4f1c2a7e-0d7b-4a52-9a4e-2f3c0e9b1a11"
}
```

Erro 409 (sem estoque):

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

---

## /pedidos - Listar pedidos

**Finalidade:** consultar pedidos com filtros por canal, status e unidade.
**Método/Rota:** `GET /pedidos?canalPedido=APP&status=AGUARDANDO_PAGAMENTO&unidadeId=1&page=1&limit=10`
**Auth/Permissão:** JWT | CLIENTE vê os próprios pedidos, funcionários veem os da sua unidade e ADMIN vê todos.

Response 200:

```json
{
  "dados": [{ "id": 1, "canalPedido": "APP", "status": "AGUARDANDO_PAGAMENTO", "total": 129.7, "itens": [] }],
  "paginacao": { "pagina": 1, "limite": 10, "total": 1, "totalPaginas": 1 }
}
```

Status codes: 200, 401, 403, 422 (filtro inválido, ex.: `canalPedido=FAX`).

---

## /pedidos - Atualizar status

**Método/Rota:** `PATCH /pedidos/{id}/status`
**Auth/Permissão:** JWT | EM_PREPARO e PRONTO: COZINHA, GERENTE, ADMIN | ENTREGUE: ATENDENTE, GERENTE, ADMIN

Request: `{ "status": "EM_PREPARO" }`

Response 200: pedido com o novo status.

Status codes: 200, 401, 403, 404, 409 (`TRANSICAO_DE_STATUS_INVALIDA`), 422 (`STATUS_NAO_PERMITIDO` para RECEBIDO/CANCELADO).

---

## /pedidos - Cancelar

**Método/Rota:** `PATCH /pedidos/{id}/cancelar`
**Auth/Permissão:** JWT | CLIENTE (dono), ATENDENTE, GERENTE, ADMIN

Request (opcional): `{ "motivo": "Cliente desistiu" }`

Efeitos: status `CANCELADO`, itens devolvidos ao estoque, pagamento aprovado marcado como `ESTORNADO` e pontos devolvidos/estornados.

Status codes: 200, 401, 403, 404, 409 (`PEDIDO_NAO_PODE_SER_CANCELADO` após entrar em preparo).

---

## /pagamentos - Solicitar pagamento (mock)

**Finalidade:** enviar a cobrança ao gateway externo simulado e atualizar o pedido.
**Método/Rota:** `POST /pagamentos`
**Auth/Permissão:** JWT | CLIENTE (dono), ATENDENTE, GERENTE, ADMIN

Request:

```json
{ "pedidoId": 1, "simulacao": "APROVAR" }
```

`simulacao` aceita `APROVAR` (padrão), `RECUSAR` ou `FALHAR`, para demonstrar todos os retornos do gateway.

Response 201 (aprovado):

```json
{
  "pagamento": {
    "id": 1,
    "pedidoId": 1,
    "valor": 129.7,
    "formaPagamento": "MOCK",
    "status": "APROVADO",
    "codigoTransacao": "MOCK-1b2978f9-5371-4581-8699-02fab95f6bce",
    "mensagem": "Pagamento aprovado.",
    "criadoEm": "2026-10-12T12:00:00.000Z"
  },
  "pedido": { "id": 1, "status": "RECEBIDO" },
  "pontosGanhos": 129,
  "respostaGateway": {
    "codigoTransacao": "MOCK-1b2978f9-5371-4581-8699-02fab95f6bce",
    "status": "APROVADO",
    "mensagem": "Pagamento aprovado.",
    "valor": 129.7,
    "processadoEm": "2026-10-12T12:00:00.000Z"
  }
}
```

Erro 402 (recusado):

```json
{
  "error": "PAGAMENTO_RECUSADO",
  "message": "Pagamento recusado pela operadora: saldo ou limite insuficiente.",
  "details": [
    { "field": "pagamentoId", "issue": "Pagamento 2 registrado como RECUSADO." },
    { "field": "pedido.status", "issue": "O pedido continua AGUARDANDO_PAGAMENTO e pode receber nova tentativa." }
  ],
  "timestamp": "2026-10-12T12:00:00.000Z",
  "path": "/pagamentos",
  "requestId": "4f1c2a7e-0d7b-4a52-9a4e-2f3c0e9b1a11"
}
```

Status codes: 201, 401, 402, 403, 404, 409 (`PEDIDO_JA_PAGO`, `PEDIDO_CANCELADO`), 422, 503 (`GATEWAY_PAGAMENTO_INDISPONIVEL`).

---

## /estoque - Entrada e saída

**Método/Rota:** `POST /estoque/entradas` e `POST /estoque/saidas`
**Auth/Permissão:** JWT | GERENTE (somente a sua unidade), ADMIN

Request:

```json
{ "unidadeId": 1, "produtoId": 6, "quantidade": 10, "motivo": "Reposição semanal" }
```

Response 201:

```json
{ "movimentacaoId": 1, "tipo": "ENTRADA", "estoqueId": 6, "saldoAtual": 13 }
```

Status codes: 201, 401, 403, 404, 409 (saída maior que o saldo), 422.

---

## /fidelidade - Saldo

**Método/Rota:** `GET /fidelidade/saldo`
**Auth/Permissão:** JWT | CLIENTE

Response 200:

```json
{
  "clienteId": 1,
  "pontos": 150,
  "valorEmReais": 15,
  "consentimentoFidelidade": true,
  "dataConsentimento": "2026-10-12T12:00:00.000Z",
  "regras": { "pontosPorRealGasto": 1, "valorDeCadaPonto": 0.1 }
}
```

---

## /unidades - Cardápio

**Método/Rota:** `GET /unidades/{id}/cardapio`
**Auth/Permissão:** público

Response 200:

```json
{
  "unidade": { "id": 1, "nome": "Raízes do Nordeste - Recife Boa Viagem" },
  "itens": [
    {
      "produtoId": 8,
      "nome": "Cocada",
      "descricao": "Cocada cremosa de forno",
      "categoria": "SOBREMESA",
      "preco": 7.5,
      "precoPromocional": 6,
      "promocao": { "id": 1, "nome": "Cocada com 20% de desconto em toda a rede", "percentualDesconto": 20 },
      "disponivel": true,
      "quantidadeDisponivel": 50
    }
  ]
}
```

Status codes: 200, 404.

## Promoções (regra de aplicação)

- Uma promoção tem produto, percentual (1 a 90%), período de vigência e, opcionalmente, unidade. Sem unidade, ela vale para toda a rede.
- Na criação do pedido, cada item recebe a promoção vigente de **maior percentual** entre as da rede e as da unidade.
- O desconto é calculado por unidade do produto e multiplicado pela quantidade. O pedido guarda o desconto e o `promocaoId` de cada item para histórico.
- O cardápio mostra o `precoPromocional` calculado com a mesma regra.
