# LGPD, Privacidade e Segurança

## Dados pessoais tratados

| Dado | Onde | Finalidade | Base legal (LGPD art. 7º) | Obrigatório |
|---|---|---|---|---|
| Nome | `usuarios.nome` | Identificar o cliente no pedido e no atendimento | Execução de contrato (inciso V) | Sim |
| E-mail | `usuarios.email` | Login e contato sobre o pedido | Execução de contrato (inciso V) | Sim |
| Senha | `usuarios.senha_hash` | Autenticação. Somente o hash bcrypt é guardado | Execução de contrato (inciso V) | Sim |
| Telefone | `clientes.telefone` | Contato sobre retirada/entrega | Execução de contrato (inciso V) | Não |
| Histórico de pedidos | `pedidos`, `itens_pedido` | Prestação do serviço e obrigações fiscais | Execução de contrato e obrigação legal (incisos V e II) | Sim |
| Pontos de fidelidade | `clientes.pontos_fidelidade`, `movimentacoes_fidelidade` | Programa de fidelidade | **Consentimento** (inciso I) | Não |
| Consentimento e data | `clientes.consentimento_fidelidade`, `clientes.data_consentimento` | Comprovar o consentimento | Consentimento (inciso I) | - |
| Logs de auditoria | `logs_auditoria` | Segurança e rastreabilidade de ações sensíveis | Legítimo interesse (inciso IX) | - |

**Minimização:** a API não coleta CPF, endereço, data de nascimento nem dados de cartão. O pagamento é feito pelo gateway externo, e a API guarda apenas o código da transação e o status.

## Consentimento

- No cadastro (`POST /usuarios`), o campo `consentimentoFidelidade` é opcional e o padrão é `false`. Se for `true`, a data do consentimento é gravada.
- O cliente pode conceder ou revogar a qualquer momento em `PATCH /fidelidade/consentimento`. A data da alteração é gravada e a ação gera o log `CONSENTIMENTO_FIDELIDADE_ALTERADO`.
- Sem consentimento o cliente não acumula pontos e não consegue resgatar (`409 CONSENTIMENTO_NECESSARIO`).

## Direitos do titular

| Direito | Como atender |
|---|---|
| Acesso aos dados | `GET /usuarios/me`, `GET /pedidos`, `GET /fidelidade/historico` |
| Revogação do consentimento | `PATCH /fidelidade/consentimento` com `{"consentimento": false}` |
| Eliminação/anonimização | `DELETE /usuarios/me`: nome, e-mail, telefone e senha são substituídos, a conta é desativada e o log `CONTA_ANONIMIZADA` é gerado. Os pedidos continuam sem vínculo com dados pessoais, para fins fiscais |

## Retenção

- Pedidos e pagamentos: mantidos por 5 anos, por obrigação fiscal. Ao anonimizar a conta, o pedido perde o vínculo com dados identificáveis.
- Logs de auditoria: guardam apenas ids, e-mail mascarado (`ma***@cliente.com.br`) e dados não sensíveis. Proposta: expurgo após 1 ano.
- Contas inativas: proposta de rotina agendada para anonimizar contas sem acesso há mais de 5 anos (não implementada, ver `requisitos.md`).

## Controles de segurança implementados

| Controle | Implementação |
|---|---|
| Hash de senha | bcrypt com custo 10 (`infrastructure/seguranca/senha.ts`) |
| Política de senha | Mínimo de 8 caracteres, com letras e números |
| Autenticação por token | JWT assinado (HS256) com expiração de 1 hora, segredo em variável de ambiente |
| Autorização por perfil | Middleware `autorizar(...)` em todas as rotas restritas |
| Autorização por unidade | Gerente, atendente e cozinha só acessam pedidos e estoque da sua unidade. Cliente só acessa os próprios pedidos |
| Respostas sem dados sensíveis | O hash da senha nunca é retornado. A listagem de usuários retorna apenas dados básicos e o acesso é auditado (`CONSULTA_DADOS_PESSOAIS`) |
| Mensagem genérica de login | "E-mail ou senha inválidos." não revela se o e-mail existe |
| Proteção contra força bruta | Rate limit de 30 tentativas de login a cada 15 minutos por IP (429) |
| Validação de entrada | Todos os bodies, params e queries passam por schemas zod |
| Cabeçalhos de segurança | helmet |
| Logs de requisição sem dados pessoais | O log registra método, rota, status, duração e `requestId`, nunca o corpo da requisição |
| Rastreabilidade | `requestId` em todas as respostas (cabeçalho `x-request-id` e corpo do erro) |

## Ações auditadas (`logs_auditoria`)

`LOGIN`, `CLIENTE_CADASTRADO`, `FUNCIONARIO_CADASTRADO`, `CONSULTA_DADOS_PESSOAIS`, `CONTA_ANONIMIZADA`, `CONSENTIMENTO_FIDELIDADE_ALTERADO`, `PEDIDO_CRIADO`, `STATUS_PEDIDO_ALTERADO`, `PEDIDO_CANCELADO`, `PAGAMENTO_APROVADO`, `PAGAMENTO_RECUSADO`, `PAGAMENTO_FALHOU`, `ESTOQUE_ENTRADA`, `ESTOQUE_SAIDA`, `UNIDADE_CRIADA`, `UNIDADE_ATUALIZADA`, `UNIDADE_DESATIVADA`, `PRODUTO_CRIADO`, `PRODUTO_ATUALIZADO`, `PRODUTO_DESATIVADO`, `PROMOCAO_CRIADA`, `PROMOCAO_DESATIVADA`.

Consulta: `GET /auditoria?entidade=pedido&entidadeId=1` (somente ADMIN).
