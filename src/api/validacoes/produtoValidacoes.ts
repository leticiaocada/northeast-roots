import { z } from 'zod'
import { paginacaoSchema } from './comuns'

export const produtoSchema = z.object({
  nome: z.string().trim().min(3).max(100),
  descricao: z.string().trim().max(255).optional(),
  preco: z.number().min(0.01).max(9999).multipleOf(0.01, 'O preço deve ter no máximo 2 casas decimais.'),
  categoria: z.string().trim().toUpperCase().min(3).max(50)
})

export const listarProdutosSchema = paginacaoSchema.extend({
  categoria: z.string().trim().toUpperCase().optional()
})
