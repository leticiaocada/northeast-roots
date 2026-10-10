import { z } from 'zod'
import { paginacaoSchema } from './comuns'

export const movimentacaoEstoqueSchema = z.object({
  unidadeId: z.number().int().min(1),
  produtoId: z.number().int().min(1),
  quantidade: z.number().int().min(1).max(10000),
  motivo: z.string().trim().min(3).max(200)
})

export const consultaEstoqueSchema = paginacaoSchema.extend({
  unidadeId: z.coerce.number().int().min(1)
})
