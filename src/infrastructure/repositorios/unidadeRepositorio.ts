import { prisma } from '../banco/prisma'

type DadosUnidade = {
  nome: string
  cep: string
  cidade: string
  estado: string
}

export const unidadeRepositorio = {
  listarAtivas(pular: number, quantidade: number) {
    return prisma.unidade.findMany({ where: { ativa: true }, skip: pular, take: quantidade, orderBy: { id: 'asc' } })
  },

  contarAtivas() {
    return prisma.unidade.count({ where: { ativa: true } })
  },

  buscarPorId(id: number) {
    return prisma.unidade.findUnique({ where: { id } })
  },

  criar(dados: DadosUnidade) {
    return prisma.unidade.create({ data: dados })
  },

  atualizar(id: number, dados: DadosUnidade) {
    return prisma.unidade.update({ where: { id }, data: dados })
  },

  desativar(id: number) {
    return prisma.unidade.update({ where: { id }, data: { ativa: false } })
  }
}
