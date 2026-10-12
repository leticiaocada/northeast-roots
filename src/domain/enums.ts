export const PERFIS = ['CLIENTE', 'ATENDENTE', 'COZINHA', 'GERENTE', 'ADMIN'] as const
export type Perfil = (typeof PERFIS)[number]

export const PERFIS_FUNCIONARIO = ['ATENDENTE', 'COZINHA', 'GERENTE', 'ADMIN'] as const

export const CANAIS_PEDIDO = ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'] as const
export type CanalPedido = (typeof CANAIS_PEDIDO)[number]

export const STATUS_PEDIDO = ['AGUARDANDO_PAGAMENTO', 'RECEBIDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'] as const
export type StatusPedido = (typeof STATUS_PEDIDO)[number]

export const FORMAS_PAGAMENTO = ['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'MOCK'] as const
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]

export const SIMULACOES_PAGAMENTO = ['APROVAR', 'RECUSAR', 'FALHAR'] as const
export type SimulacaoPagamento = (typeof SIMULACOES_PAGAMENTO)[number]
