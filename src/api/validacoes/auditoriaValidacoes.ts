import { z } from 'zod'
import { paginacaoSchema } from './comuns'

export const listarAuditoriaSchema = paginacaoSchema.extend({
  acao: z.string().trim().toUpperCase().optional(),
  entidade: z.string().trim().toLowerCase().optional(),
  entidadeId: z.coerce.number().int().min(1).optional()
})
