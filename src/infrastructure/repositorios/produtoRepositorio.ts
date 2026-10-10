import { prisma } from '../banco/prisma'

type DadosProduto = {
  nome: string
  descricao?: string
  preco: number
  categoria: string
}

type FiltrosProduto = {
  categoria?: string
}

export const produtoRepositorio = {
  listarAtivos(filtros: FiltrosProduto, pular: number, quantidade: number) {
    return prisma.produto.findMany({
      where: { ativo: true, categoria: filtros.categoria },
      skip: pular,
      take: quantidade,
      orderBy: { id: 'asc' }
    })
  },

  contarAtivos(filtros: FiltrosProduto) {
    return prisma.produto.count({ where: { ativo: true, categoria: filtros.categoria } })
  },

  buscarPorId(id: number) {
    return prisma.produto.findUnique({ where: { id } })
  },

  criar(dados: DadosProduto) {
    return prisma.produto.create({ data: dados })
  },

  atualizar(id: number, dados: DadosProduto) {
    return prisma.produto.update({ where: { id }, data: dados })
  },

  desativar(id: number) {
    return prisma.produto.update({ where: { id }, data: { ativo: false } })
  }
}
