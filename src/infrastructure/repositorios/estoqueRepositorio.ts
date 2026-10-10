import { prisma, Transacao } from '../banco/prisma'

type DadosMovimentacao = {
  estoqueId: number
  tipo: 'ENTRADA' | 'SAIDA'
  quantidade: number
  motivo: string
  usuarioId: number | null
  pedidoId?: number
}

export const estoqueRepositorio = {
  buscar(unidadeId: number, produtoId: number, db: Transacao = prisma) {
    return db.estoque.findUnique({ where: { unidadeId_produtoId: { unidadeId, produtoId } } })
  },

  listarPorUnidade(unidadeId: number, pular: number, quantidade: number) {
    return prisma.estoque.findMany({
      where: { unidadeId },
      include: { produto: true },
      skip: pular,
      take: quantidade,
      orderBy: { produtoId: 'asc' }
    })
  },

  contarPorUnidade(unidadeId: number) {
    return prisma.estoque.count({ where: { unidadeId } })
  },

  listarCardapio(unidadeId: number) {
    return prisma.estoque.findMany({
      where: { unidadeId, produto: { ativo: true } },
      include: { produto: true },
      orderBy: [{ produto: { categoria: 'asc' } }, { produto: { nome: 'asc' } }]
    })
  },

  adicionar(unidadeId: number, produtoId: number, quantidade: number, db: Transacao = prisma) {
    return db.estoque.upsert({
      where: { unidadeId_produtoId: { unidadeId, produtoId } },
      create: { unidadeId, produtoId, quantidade },
      update: { quantidade: { increment: quantidade } }
    })
  },

  async retirar(estoqueId: number, quantidade: number, db: Transacao = prisma) {
    const resultado = await db.estoque.updateMany({
      where: { id: estoqueId, quantidade: { gte: quantidade } },
      data: { quantidade: { decrement: quantidade } }
    })

    return resultado.count > 0
  },

  registrarMovimentacao(dados: DadosMovimentacao, db: Transacao = prisma) {
    return db.movimentacaoEstoque.create({ data: dados })
  },

  listarMovimentacoes(unidadeId: number, pular: number, quantidade: number) {
    return prisma.movimentacaoEstoque.findMany({
      where: { estoque: { unidadeId } },
      include: { estoque: { include: { produto: true } } },
      skip: pular,
      take: quantidade,
      orderBy: { id: 'desc' }
    })
  },

  contarMovimentacoes(unidadeId: number) {
    return prisma.movimentacaoEstoque.count({ where: { estoque: { unidadeId } } })
  }
}
