import { Request, Response } from 'express'
import { pedidoService } from '../../application/services/pedidoService'
import { idParametroSchema } from '../validacoes/comuns'
import {
  atualizarStatusSchema,
  cancelarPedidoSchema,
  criarPedidoSchema,
  listarPedidosSchema
} from '../validacoes/pedidoValidacoes'

export const pedidoController = {
  async criar(req: Request, res: Response) {
    const dados = criarPedidoSchema.parse(req.body ?? {})
    const pedido = await pedidoService.criar(dados, req.usuario!)
    res.status(201).json(pedido)
  },

  async listar(req: Request, res: Response) {
    const { page, limit, ...filtros } = listarPedidosSchema.parse(req.query)
    const resultado = await pedidoService.listar(filtros, page, limit, req.usuario!)
    res.json(resultado)
  },

  async buscarPorId(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const pedido = await pedidoService.buscarPorId(id, req.usuario!)
    res.json(pedido)
  },

  async atualizarStatus(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const { status } = atualizarStatusSchema.parse(req.body ?? {})
    const pedido = await pedidoService.atualizarStatus(id, status, req.usuario!)
    res.json(pedido)
  },

  async cancelar(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const { motivo } = cancelarPedidoSchema.parse(req.body ?? {})
    const pedido = await pedidoService.cancelar(id, motivo, req.usuario!)
    res.json(pedido)
  }
}
