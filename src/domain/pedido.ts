import { ErroAplicacao } from './ErroAplicacao'
import { Perfil, StatusPedido } from './enums'

export type ItemCalculado = {
  precoCentavos: number
  quantidade: number
  descontoCentavos: number
}

const proximosStatusPermitidos: Record<StatusPedido, StatusPedido[]> = {
  AGUARDANDO_PAGAMENTO: ['RECEBIDO', 'CANCELADO'],
  RECEBIDO: ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['PRONTO'],
  PRONTO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: []
}

const perfisQuePodemDefinirStatus: Partial<Record<StatusPedido, Perfil[]>> = {
  EM_PREPARO: ['COZINHA', 'GERENTE', 'ADMIN'],
  PRONTO: ['COZINHA', 'GERENTE', 'ADMIN'],
  ENTREGUE: ['ATENDENTE', 'GERENTE', 'ADMIN']
}

export function validarMudancaDeStatus(statusAtual: StatusPedido, novoStatus: StatusPedido, perfil: Perfil) {
  const perfisPermitidos = perfisQuePodemDefinirStatus[novoStatus]

  if (!perfisPermitidos) {
    throw new ErroAplicacao(422, 'STATUS_NAO_PERMITIDO', `O status ${novoStatus} não pode ser definido manualmente.`, [
      { field: 'status', issue: 'Use EM_PREPARO, PRONTO ou ENTREGUE. Pagamento e cancelamento possuem rotas próprias.' }
    ])
  }

  if (!perfisPermitidos.includes(perfil)) {
    throw new ErroAplicacao(403, 'ACESSO_NEGADO', `O perfil ${perfil} não pode alterar o pedido para ${novoStatus}.`)
  }

  if (!proximosStatusPermitidos[statusAtual].includes(novoStatus)) {
    throw new ErroAplicacao(409, 'TRANSICAO_DE_STATUS_INVALIDA', `Não é possível alterar o pedido de ${statusAtual} para ${novoStatus}.`)
  }
}

export function podeSerCancelado(status: StatusPedido) {
  return proximosStatusPermitidos[status].includes('CANCELADO')
}

export function podeReceberPagamento(status: StatusPedido) {
  return status === 'AGUARDANDO_PAGAMENTO'
}

export function calcularValoresDoPedido(itens: ItemCalculado[], descontoPontosCentavos: number) {
  let subtotalCentavos = 0
  let descontoItensCentavos = 0

  for (const item of itens) {
    subtotalCentavos += item.precoCentavos * item.quantidade
    descontoItensCentavos += item.descontoCentavos
  }

  const descontoCentavos = descontoItensCentavos + descontoPontosCentavos
  const totalCentavos = subtotalCentavos - descontoCentavos

  if (totalCentavos < 0) {
    throw new ErroAplicacao(422, 'DESCONTO_MAIOR_QUE_TOTAL', 'O desconto não pode ser maior que o valor do pedido.', [
      { field: 'pontosResgatados', issue: 'Diminua a quantidade de pontos para resgate.' }
    ])
  }

  return { subtotalCentavos, descontoCentavos, totalCentavos }
}
