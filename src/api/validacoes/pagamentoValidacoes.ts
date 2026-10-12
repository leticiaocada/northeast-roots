import { z } from 'zod'
import { SIMULACOES_PAGAMENTO } from '../../domain/enums'

export const solicitarPagamentoSchema = z.object({
  pedidoId: z.number().int().min(1),
  simulacao: z.enum(SIMULACOES_PAGAMENTO).default('APROVAR')
})

export const listarPagamentosSchema = z.object({
  pedidoId: z.coerce.number().int().min(1)
})
