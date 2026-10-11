import { z } from 'zod'

export const consentimentoSchema = z.object({
  consentimento: z.boolean()
})
