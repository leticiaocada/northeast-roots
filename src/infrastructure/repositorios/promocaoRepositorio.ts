import { prisma } from '../banco/prisma'

type DadosPromocao = {
  nome: string
  produtoId: number
  unidadeId?: number
  percentualDesconto: number
  dataInicio: Date
  dataFim: Date
}

function filtroVigentes(data: Date) {
  return { ativa: true, dataInicio: { lte: data }, dataFim: { gte: data } }
}

export const promocaoRepositorio = {
  listarVigentesDaUnidade(unidadeId: number, data: Date) {
    return prisma.promocao.findMany({
      where: { ...filtroVigentes(data), OR: [{ unidadeId: null }, { unidadeId }] }
    })
  },

  listarVigentes(data: Date, pular: number, quantidade: number) {
    return prisma.promocao.findMany({
      where: filtroVigentes(data),
      include: { produto: { select: { nome: true } } },
      skip: pular,
      take: quantidade,
      orderBy: { id: 'asc' }
    })
  },

  contarVigentes(data: Date) {
    return prisma.promocao.count({ where: filtroVigentes(data) })
  },

  buscarPorId(id: number) {
    return prisma.promocao.findUnique({ where: { id } })
  },

  criar(dados: DadosPromocao) {
    return prisma.promocao.create({ data: dados })
  },

  desativar(id: number) {
    return prisma.promocao.update({ where: { id }, data: { ativa: false } })
  }
}
