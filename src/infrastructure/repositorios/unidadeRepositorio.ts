import { prisma } from '../banco/prisma'

export const unidadeRepositorio = {
  buscarPorId(id: number) {
    return prisma.unidade.findUnique({ where: { id } })
  }
}
