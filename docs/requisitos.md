# Requisitos e Priorização

## Requisitos funcionais

| ID | Requisito | Situação | Onde está |
|---|---|---|---|
| RF01 | Cadastro e autenticação de usuários com perfis (CLIENTE, ATENDENTE, COZINHA, GERENTE, ADMIN) | Implementado | `POST /usuarios`, `POST /usuarios/funcionarios`, `POST /auth/login` |
| RF02 | Cadastro, edição, consulta e exclusão (lógica) de unidades da rede | Implementado | `/unidades` |
| RF03 | Cadastro e gerenciamento de produtos | Implementado | `/produtos` |
| RF04 | Cardápio por unidade com disponibilidade | Implementado | `GET /unidades/{id}/cardapio` |
| RF05 | Realização de pedidos com itens, valores e status | Implementado | `POST /pedidos` |
| RF06 | Registro obrigatório do canal de origem (`canalPedido`: APP, TOTEM, BALCAO, PICKUP, WEB) | Implementado | `POST /pedidos` |
| RF07 | Consulta e filtro de pedidos por canal, status e unidade | Implementado | `GET /pedidos?canalPedido=TOTEM&status=...` |
| RF08 | Atualização de status (cozinha → pronto → entregue / cancelado) | Implementado | `PATCH /pedidos/{id}/status`, `PATCH /pedidos/{id}/cancelar` |
| RF09 | Controle de estoque por unidade (entrada/saída) e bloqueio de venda sem estoque | Implementado | `/estoque`, validação no `POST /pedidos` |
| RF10 | Programa de fidelidade com pontos, resgate simples e consentimento | Implementado | `/fidelidade`, campo `pontosResgatados` no pedido |
| RF11 | Promoções/campanhas por produto e unidade | Implementado | `/promocoes`, aplicadas no pedido e no cardápio |
| RF12 | Solicitação de pagamento a serviço externo (mock) com registro e retorno de status e payload | Implementado | `POST /pagamentos` |
| RF13 | Histórico de pedidos do cliente | Implementado | `GET /pedidos` com perfil CLIENTE |
| RF14 | Consulta de pedidos pelos gestores da unidade | Implementado | `GET /pedidos` com perfil GERENTE |
| RF15 | Consulta de logs de auditoria | Implementado | `GET /auditoria` |

## Requisitos não funcionais

| ID | Requisito | Como foi atendido |
|---|---|---|
| RNF01 | Segurança: autenticação por token | JWT com expiração configurável (`JWT_EXPIRES_IN`) |
| RNF02 | Controle de acesso por perfil | Middleware `autorizar` em cada rota e restrição de dados pela unidade do funcionário |
| RNF03 | Senha armazenada com hash | bcrypt (custo 10). O hash nunca é retornado |
| RNF04 | LGPD | Minimização, consentimento registrado com data, anonimização e e-mail mascarado nos logs (ver `lgpd-seguranca.md`) |
| RNF05 | Logs e auditoria de ações sensíveis | Tabela `logs_auditoria` e log estruturado em JSON de cada requisição com `requestId` |
| RNF06 | Desempenho em horários de pico | Paginação em todas as listagens, índices em `pedidos` e baixa de estoque com update condicional (sem venda acima do saldo em concorrência) |
| RNF07 | Disponibilidade | Aplicação em container Docker, rota `GET /health` e rate limit no login |
| RNF08 | Tolerância a falhas na integração de pagamento | Falha do gateway retorna 503, registra a tentativa como FALHA e mantém o pedido aguardando pagamento para nova tentativa |
| RNF09 | Documentação | Swagger/OpenAPI em `/docs` |
| RNF10 | Banco relacional com integridade | PostgreSQL com FKs, índices únicos e transações |
| RNF11 | Arquitetura monolítica em camadas | Domain, Application, Infrastructure e API |
| RNF12 | Validação de todas as entradas | Schemas zod com erro padronizado (422) |

## Multicanalidade

O canal de origem é um dado de domínio:

- O ENUM `CanalPedido` (APP, TOTEM, BALCAO, PICKUP, WEB) existe no banco e no código.
- `canalPedido` é obrigatório na criação do pedido. Ausente ou inválido, a API retorna 422 com mensagem padronizada.
- A listagem permite filtrar por canal (`?canalPedido=TOTEM`), e a coluna é indexada.
- O pedido também guarda quem o registrou (`criado_por_id`) e a unidade, o que permite rastrear pedidos de balcão feitos por atendentes e pedidos de autoatendimento.
- O log de auditoria `PEDIDO_CRIADO` grava o canal.

## Priorização (MVP)

O fluxo escolhido foi o **Fluxo A: Pedido → Pagamento mock → Atualização de status**, por ser o centro da operação de um restaurante multicanal.

| Prioridade | Item | Justificativa |
|---|---|---|
| Alta | Autenticação JWT + perfis | Sem isso nenhuma rota sensível pode ser exposta |
| Alta | Pedido com canal, validação de estoque e cálculo de total | Fluxo crítico do negócio |
| Alta | Pagamento mock (aprovado, recusado e falha) | Fecha o fluxo e demonstra tolerância a falhas |
| Alta | Atualização de status com regras de transição | Integra cozinha e atendimento |
| Alta | Padrão de erro e validação | Contrato claro entre front-end e back-end |
| Média | Estoque por unidade com movimentações | Necessário para bloquear venda sem estoque |
| Média | Auditoria e LGPD | Rastreabilidade e conformidade legal |
| Média | Fidelidade e promoções | Regras de negócio do estudo de caso, implementadas de forma simples |

### O que ficou como proposta (não implementado)

- **Refresh token e logout**: o token tem expiração curta (1 hora). Para revogação imediata seria necessário guardar tokens em uma lista de bloqueio (por exemplo, Redis).
- **Gateway de pagamento real e webhook**: o pagamento é síncrono e simulado. Em produção o retorno viria por webhook assinado, com chave de idempotência enviada ao provedor.
- **Rotina automática de retenção**: a anonimização é feita sob demanda pelo cliente. Uma rotina agendada para anonimizar contas inativas há mais de 5 anos ficou documentada como proposta.
- **Relatórios e indicadores para a matriz**: podem ser feitos a partir do filtro de pedidos por unidade e canal.
- **Cache do cardápio**: para horários de pico, seria possível cachear o cardápio por unidade com expiração curta.
