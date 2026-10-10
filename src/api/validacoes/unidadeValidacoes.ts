import { z } from 'zod'

export const unidadeSchema = z.object({
  nome: z.string().trim().min(3).max(100),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 00000-000.'),
  cidade: z.string().trim().min(2).max(100),
  estado: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'Estado deve ser a sigla da UF com 2 letras.')
})
