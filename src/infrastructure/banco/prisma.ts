import { Prisma, PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export type Transacao = Prisma.TransactionClient

export function executarTransacao<T>(funcao: (tx: Transacao) => Promise<T>) {
  return prisma.$transaction(funcao)
}
