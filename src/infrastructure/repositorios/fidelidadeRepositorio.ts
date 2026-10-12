import { prisma, Transacao } from '../banco/prisma'

type DadosMovimentacao = {
  clienteId: number
  pedidoId?: number
  tipo: 'CREDITO' | 'DEBITO'
  pontos: number
  descricao: string
}

export const fidelidadeRepositorio = {
  registrar(dados: DadosMovimentacao, db: Transacao = prisma) {
    return db.movimentacaoFidelidade.create({ data: dados })
  },

  listarPorCliente(clienteId: number, pular: number, quantidade: number) {
    return prisma.movimentacaoFidelidade.findMany({
      where: { clienteId },
      skip: pular,
      take: quantidade,
      orderBy: { id: 'desc' }
    })
  },

  contarPorCliente(clienteId: number) {
    return prisma.movimentacaoFidelidade.count({ where: { clienteId } })
  },

  listarPorPedido(pedidoId: number, db: Transacao = prisma) {
    return db.movimentacaoFidelidade.findMany({ where: { pedidoId } })
  }
}
