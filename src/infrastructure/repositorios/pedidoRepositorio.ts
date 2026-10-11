import { CanalPedido, FormaPagamento, StatusPedido } from '../../domain/enums'
import { prisma, Transacao } from '../banco/prisma'

type DadosItem = {
  produtoId: number
  promocaoId: number | null
  quantidade: number
  precoUnitario: number
  desconto: number
}

type DadosPedido = {
  clienteId: number | null
  unidadeId: number
  canalPedido: CanalPedido
  formaPagamento: FormaPagamento
  subtotal: number
  desconto: number
  total: number
  pontosUsados: number
  observacao?: string
  criadoPorId: number
  itens: DadosItem[]
}

type FiltrosPedido = {
  clienteId?: number
  unidadeId?: number
  canalPedido?: CanalPedido
  status?: StatusPedido
}

const incluirItens = {
  itens: { include: { produto: { select: { nome: true } } } }
}

export const pedidoRepositorio = {
  criar(dados: DadosPedido, db: Transacao = prisma) {
    const { itens, ...pedido } = dados

    return db.pedido.create({
      data: { ...pedido, itens: { create: itens } },
      include: incluirItens
    })
  },

  buscarPorId(id: number, db: Transacao = prisma) {
    return db.pedido.findUnique({ where: { id }, include: incluirItens })
  },

  listar(filtros: FiltrosPedido, pular: number, quantidade: number) {
    return prisma.pedido.findMany({
      where: filtros,
      include: incluirItens,
      skip: pular,
      take: quantidade,
      orderBy: { id: 'desc' }
    })
  },

  contar(filtros: FiltrosPedido) {
    return prisma.pedido.count({ where: filtros })
  },

  async atualizarStatus(id: number, statusAtual: StatusPedido, novoStatus: StatusPedido, db: Transacao = prisma) {
    const resultado = await db.pedido.updateMany({
      where: { id, status: statusAtual },
      data: { status: novoStatus }
    })

    return resultado.count > 0
  }
}
