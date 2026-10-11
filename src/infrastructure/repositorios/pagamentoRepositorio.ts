import { Prisma } from '@prisma/client'
import { FormaPagamento } from '../../domain/enums'
import { prisma, Transacao } from '../banco/prisma'

type DadosPagamento = {
  pedidoId: number
  valor: number
  formaPagamento: FormaPagamento
  status: 'APROVADO' | 'RECUSADO' | 'FALHA'
  codigoTransacao?: string
  mensagem: string
  respostaGateway?: Prisma.InputJsonObject
}

export const pagamentoRepositorio = {
  criar(dados: DadosPagamento, db: Transacao = prisma) {
    return db.pagamento.create({ data: dados })
  },

  listarPorPedido(pedidoId: number) {
    return prisma.pagamento.findMany({ where: { pedidoId }, orderBy: { id: 'asc' } })
  },

  marcarComoEstornado(pedidoId: number, db: Transacao = prisma) {
    return db.pagamento.updateMany({
      where: { pedidoId, status: 'APROVADO' },
      data: { status: 'ESTORNADO' }
    })
  }
}
