import { Request, Response } from 'express'
import { estoqueService } from '../../application/services/estoqueService'
import { consultaEstoqueSchema, movimentacaoEstoqueSchema } from '../validacoes/estoqueValidacoes'

export const estoqueController = {
  async consultar(req: Request, res: Response) {
    const { unidadeId, page, limit } = consultaEstoqueSchema.parse(req.query)
    const resultado = await estoqueService.consultarPorUnidade(unidadeId, page, limit, req.usuario!)
    res.json(resultado)
  },

  async registrarEntrada(req: Request, res: Response) {
    const dados = movimentacaoEstoqueSchema.parse(req.body ?? {})
    const resultado = await estoqueService.registrarEntrada(dados, req.usuario!)
    res.status(201).json(resultado)
  },

  async registrarSaida(req: Request, res: Response) {
    const dados = movimentacaoEstoqueSchema.parse(req.body ?? {})
    const resultado = await estoqueService.registrarSaida(dados, req.usuario!)
    res.status(201).json(resultado)
  },

  async listarMovimentacoes(req: Request, res: Response) {
    const { unidadeId, page, limit } = consultaEstoqueSchema.parse(req.query)
    const resultado = await estoqueService.listarMovimentacoes(unidadeId, page, limit, req.usuario!)
    res.json(resultado)
  }
}
