import { z } from 'zod'
import { CANAIS_PEDIDO, FORMAS_PAGAMENTO, STATUS_PEDIDO } from '../../domain/enums'
import { paginacaoSchema } from './comuns'

const canalPedido = z.enum(CANAIS_PEDIDO, {
  required_error: 'canalPedido é obrigatório. Valores aceitos: APP, TOTEM, BALCAO, PICKUP, WEB.'
})

export const criarPedidoSchema = z
  .object({
    unidadeId: z.number().int().min(1),
    canalPedido,
    clienteId: z.number().int().min(1).optional(),
    formaPagamento: z.enum(FORMAS_PAGAMENTO),
    observacao: z.string().trim().max(200).optional(),
    itens: z
      .array(
        z.object({
          produtoId: z.number().int().min(1),
          quantidade: z.number().int().min(1).max(50)
        })
      )
      .min(1)
  })
  .refine((dados) => new Set(dados.itens.map((item) => item.produtoId)).size === dados.itens.length, {
    message: 'Não repita o mesmo produto em itens diferentes, ajuste a quantidade.',
    path: ['itens']
  })

export const listarPedidosSchema = paginacaoSchema.extend({
  canalPedido: z.enum(CANAIS_PEDIDO).optional(),
  status: z.enum(STATUS_PEDIDO).optional(),
  unidadeId: z.coerce.number().int().min(1).optional()
})

export const atualizarStatusSchema = z.object({
  status: z.enum(STATUS_PEDIDO)
})

export const cancelarPedidoSchema = z.object({
  motivo: z.string().trim().min(3).max(200).optional()
})
