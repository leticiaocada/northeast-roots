import { Request, Response } from 'express'
import { pagamentoService } from '../../application/services/pagamentoService'
import { listarPagamentosSchema, solicitarPagamentoSchema } from '../validacoes/pagamentoValidacoes'

export const pagamentoController = {
  async solicitar(req: Request, res: Response) {
    const { pedidoId, simulacao } = solicitarPagamentoSchema.parse(req.body ?? {})
    const resultado = await pagamentoService.solicitar(pedidoId, simulacao, req.usuario!)
    res.status(201).json(resultado)
  },

  async listarPorPedido(req: Request, res: Response) {
    const { pedidoId } = listarPagamentosSchema.parse(req.query)
    const pagamentos = await pagamentoService.listarPorPedido(pedidoId, req.usuario!)
    res.json(pagamentos)
  }
}
