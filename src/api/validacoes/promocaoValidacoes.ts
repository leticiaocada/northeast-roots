import { z } from 'zod'

export const promocaoSchema = z
  .object({
    nome: z.string().trim().min(3).max(100),
    produtoId: z.number().int().min(1),
    unidadeId: z.number().int().min(1).optional(),
    percentualDesconto: z.number().int().min(1).max(90),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date()
  })
  .refine((dados) => dados.dataFim > dados.dataInicio, {
    message: 'A data de fim deve ser posterior à data de início.',
    path: ['dataFim']
  })
