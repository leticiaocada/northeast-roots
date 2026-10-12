import { prisma, Transacao } from '../banco/prisma'

export const clienteRepositorio = {
  buscarPorId(id: number, db: Transacao = prisma) {
    return db.cliente.findUnique({ where: { id } })
  },

  buscarPorUsuarioId(usuarioId: number) {
    return prisma.cliente.findUnique({ where: { usuarioId } })
  }
}
