import { prisma, Transacao } from '../banco/prisma'

export const clienteRepositorio = {
  buscarPorId(id: number, db: Transacao = prisma) {
    return db.cliente.findUnique({ where: { id } })
  },

  buscarPorUsuarioId(usuarioId: number) {
    return prisma.cliente.findUnique({ where: { usuarioId } })
  },

  creditarPontos(id: number, pontos: number, db: Transacao = prisma) {
    return db.cliente.update({ where: { id }, data: { pontosFidelidade: { increment: pontos } } })
  },

  async debitarPontos(id: number, pontos: number, db: Transacao = prisma) {
    const resultado = await db.cliente.updateMany({
      where: { id, pontosFidelidade: { gte: pontos } },
      data: { pontosFidelidade: { decrement: pontos } }
    })

    return resultado.count > 0
  },

  atualizarConsentimento(id: number, consentimento: boolean) {
    return prisma.cliente.update({
      where: { id },
      data: { consentimentoFidelidade: consentimento, dataConsentimento: new Date() }
    })
  }
}
