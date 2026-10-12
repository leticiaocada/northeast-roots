import { Prisma } from '@prisma/client'
import { prisma, Transacao } from '../banco/prisma'

type DadosLog = {
  usuarioId: number | null
  acao: string
  entidade: string
  entidadeId?: number | null
  detalhes?: Prisma.InputJsonObject
}

type FiltrosLog = {
  acao?: string
  entidade?: string
  entidadeId?: number
}

export const auditoriaRepositorio = {
  criar(dados: DadosLog, db: Transacao = prisma) {
    return db.logAuditoria.create({ data: dados })
  },

  listar(filtros: FiltrosLog, pular: number, quantidade: number) {
    return prisma.logAuditoria.findMany({
      where: filtros,
      skip: pular,
      take: quantidade,
      orderBy: { id: 'desc' }
    })
  },

  contar(filtros: FiltrosLog) {
    return prisma.logAuditoria.count({ where: filtros })
  }
}
