# Plano de Testes

## Evidências

- **Coleção Postman:** `postman/raizes-do-nordeste.postman_collection.json`. Cada cenário tem o ID (T01, T02...) no nome da requisição e scripts de teste que verificam status code e trechos do response.
- **Testes automatizados:** `npm test` roda os testes unitários das regras de domínio em `tests/` (22 testes).
- **Swagger:** `http://localhost:3000/docs`, com exemplos de request/response e de erros.

## Como executar

1. Suba a API com o seed aplicado (`docker compose up --build` ou passos do README).
2. No Postman, importe a coleção. A variável `baseUrl` já vem como `http://localhost:3000`.
3. Clique na coleção e em **Run** para executar todas as pastas **na ordem**. Os logins da pasta `01 - Auth` salvam os tokens em variáveis da coleção, e o pedido criado em T11 é usado nos pagamentos e na mudança de status.
4. Também é possível rodar pelo terminal:

```bash
npx newman run postman/raizes-do-nordeste.postman_collection.json
```

A coleção pode ser executada mais de uma vez sem refazer o seed.

## Cenários

| ID | Cenário | Endpoint | Pré-condição | Entrada | Esperado (status + response) | Evidência (coleção) |
|---|---|---|---|---|---|---|
| T01 | Login válido | POST /auth/login | Seed aplicado | `{email: maria@cliente.com.br, senha}` | 200 + `accessToken`, `tokenType: Bearer` | 01 - Auth / T01 - Login válido (cliente) |
| T02 | Login com senha errada | POST /auth/login | Seed aplicado | senha incorreta | 401 + `CREDENCIAIS_INVALIDAS` no erro padrão | 01 - Auth / T02 |
| T03 | Cadastro de cliente com consentimento | POST /usuarios | - | nome, e-mail novo, senha, `consentimentoFidelidade: true` | 201, sem senha no response, `dataConsentimento` preenchida | 02 - Usuarios / T03 |
| T04 | E-mail em formato inválido | POST /usuarios | - | `email: "email-invalido"` | 422 + `VALIDACAO`, `details[0].field = email` | 02 - Usuarios / T04 |
| T05 | Cardápio da unidade | GET /unidades/1/cardapio | Seed aplicado | id = 1 | 200 + itens com `disponivel` e `precoPromocional` da Cocada = 6 | 03 - Unidades e Cardapio / T05 |
| T06 | Cardápio de unidade inexistente | GET /unidades/999/cardapio | - | id = 999 | 404 + `UNIDADE_NAO_ENCONTRADA` | 03 / T06 |
| T07 | Cliente tenta cadastrar produto | POST /produtos | Token de CLIENTE | produto válido | 403 + `ACESSO_NEGADO` | 04 - Produtos / T07 |
| T08 | Gerente consulta estoque da sua unidade | GET /estoque?unidadeId=1 | Token de GERENTE (Recife) | unidadeId = 1 | 200 + saldo por produto | 05 - Estoque / T08 |
| T09 | Gerente consulta estoque de outra unidade | GET /estoque?unidadeId=2 | Token de GERENTE (Recife) | unidadeId = 2 | 403 + `ACESSO_NEGADO` | 05 - Estoque / T09 |
| T10 | Acesso sem token | GET /pedidos | - | sem Authorization | 401 + `TOKEN_AUSENTE` | 06 - Pedidos / T10 |
| T11 | Pedido com itens válidos | POST /pedidos | Token de CLIENTE, estoque disponível | `canalPedido: TOTEM`, 2x produto 1 e 1x produto 2 | 201 + `status: AGUARDANDO_PAGAMENTO`, `canalPedido: TOTEM`, `total: 129.7` | 06 / T11 |
| T12 | Pedido sem canalPedido | POST /pedidos | Token de CLIENTE | body sem `canalPedido` | 422 + `details[0].field = canalPedido` | 06 / T12 |
| T13 | Quantidade negativa | POST /pedidos | Token de CLIENTE | `quantidade: -2` | 422 + `details[0].field = itens[0].quantidade` | 06 / T13 |
| T14 | Produto inexistente | POST /pedidos | Token de CLIENTE | `produtoId: 999` | 404 + `PRODUTO_NAO_ENCONTRADO` | 06 / T14 |
| T15 | Estoque insuficiente | POST /pedidos | Moqueca com 3 unidades em Recife | 10x produto 6 | 409 + `ESTOQUE_INSUFICIENTE`, `issue: "Disponível: 3"` | 06 / T15 |
| T16 | Filtro por canal | GET /pedidos?canalPedido=TOTEM&status=AGUARDANDO_PAGAMENTO | Token de ADMIN, T11 executado | query params | 200 + todos os pedidos com `canalPedido = TOTEM` | 06 / T16 |
| T17 | Pagamento mock aprovado | POST /pagamentos | Pedido do T11 | `simulacao: APROVAR` | 201 + `pagamento.status: APROVADO`, `pedido.status: RECEBIDO`, `pontosGanhos: 129` | 07 - Pagamentos / T17 |
| T18 | Pagamento duplicado (idempotência) | POST /pagamentos | T17 executado | mesmo pedido | 409 + `PEDIDO_JA_PAGO` | 07 / T18 |
| T19 | Pagamento mock recusado | POST /pagamentos | Novo pedido aguardando pagamento | `simulacao: RECUSAR` | 402 + `PAGAMENTO_RECUSADO` e mensagem da operadora | 07 / T19 |
| T20 | Status após recusa | GET /pedidos/{id} | T19 executado | id do pedido recusado | 200 + `status: AGUARDANDO_PAGAMENTO` | 07 / T20 |
| T21 | Gateway indisponível | POST /pagamentos | Pedido aguardando pagamento | `simulacao: FALHAR` | 503 + `GATEWAY_PAGAMENTO_INDISPONIVEL` | 07 / T21 |
| T22 | Perfil sem permissão para alterar status | PATCH /pedidos/{id}/status | Token de CLIENTE | `status: EM_PREPARO` | 403 + `ACESSO_NEGADO` | 08 - Status do Pedido / T22 |
| T23 | Cozinha inicia preparo | PATCH /pedidos/{id}/status | Pedido RECEBIDO, token de COZINHA | `status: EM_PREPARO` | 200 + `status: EM_PREPARO` | 08 / T23 |
| T24 | Cozinha finaliza preparo | PATCH /pedidos/{id}/status | Pedido EM_PREPARO | `status: PRONTO` | 200 + `status: PRONTO` | 08 / T24 |
| T25 | Atendente entrega | PATCH /pedidos/{id}/status | Pedido PRONTO, token de ATENDENTE | `status: ENTREGUE` | 200 + `status: ENTREGUE` | 08 / T25 |
| T26 | Transição inválida | PATCH /pedidos/{id}/status | Pedido ENTREGUE | `status: EM_PREPARO` | 409 + `TRANSICAO_DE_STATUS_INVALIDA` | 08 / T26 |
| T27 | Cancelamento pelo cliente | PATCH /pedidos/{id}/cancelar | Pedido aguardando pagamento | `motivo` | 200 + `status: CANCELADO` (estoque devolvido) | 08 / T27 |
| T28 | Saldo de pontos | GET /fidelidade/saldo | T17 executado | - | 200 + `consentimentoFidelidade: true`, `pontos > 0` | 09 - Fidelidade / T28 |
| T29 | Resgate acima do saldo | POST /pedidos | Token de CLIENTE | `pontosResgatados: 999999` | 409 + `PONTOS_INSUFICIENTES` | 09 / T29 |
| T30 | Auditoria de ações sensíveis | GET /auditoria?entidade=pedido&entidadeId={id} | Token de ADMIN, T11 a T25 executados | id do pedido | 200 + ações `PEDIDO_CRIADO`, `PAGAMENTO_APROVADO`, `STATUS_PEDIDO_ALTERADO` | 11 - Auditoria / T30 |
| T31 | Cliente tenta acessar auditoria | GET /auditoria | Token de CLIENTE | - | 403 + `ACESSO_NEGADO` | 11 / T31 |

Resumo: **31 cenários**, sendo **14 positivos** (T01, T03, T05, T08, T11, T16, T17, T20, T23, T24, T25, T27, T28, T30) e **17 negativos** (T02, T04, T06, T07, T09, T10, T12, T13, T14, T15, T18, T19, T21, T22, T26, T29, T31). A coleção também tem requisições de apoio sem ID (logins dos demais perfis, listagens e consultas).

## Cobertura obrigatória do roteiro

| Item do roteiro | Cenários |
|---|---|
| Login (token válido) | T01 |
| Acesso sem token (401) | T10 |
| Perfil sem permissão (403) | T07, T09, T22, T31 |
| Campo obrigatório ausente (422) | T12 |
| Tipo/formato inválido (422) | T04, T13 |
| Pedido com itens válidos (201) | T11 |
| Produto/unidade inexistente (404) | T06, T14 |
| Estoque insuficiente (409) | T15 |
| Pagamento aprovado → status atualizado | T17, T23 a T25 |
| Pagamento recusado → status e mensagem coerentes | T19, T20 |
| Logs/auditoria de ação sensível | T30 |

## Testes automatizados (Jest)

| Arquivo | O que testa |
|---|---|
| `tests/pedido.test.ts` | Transições de status permitidas e proibidas, perfis por status, cancelamento, pagamento e cálculo de subtotal/desconto/total |
| `tests/fidelidade.test.ts` | Pontos ganhos, valor do ponto, resgate sem consentimento e sem saldo |
| `tests/promocao-estoque.test.ts` | Escolha da melhor promoção, cálculo do desconto, disponibilidade de estoque e máscara de e-mail |
