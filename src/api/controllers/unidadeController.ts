import { Request, Response } from 'express'
import { unidadeService } from '../../application/services/unidadeService'
import { idParametroSchema, paginacaoSchema } from '../validacoes/comuns'
import { unidadeSchema } from '../validacoes/unidadeValidacoes'

export const unidadeController = {
  async listar(req: Request, res: Response) {
    const { page, limit } = paginacaoSchema.parse(req.query)
    const resultado = await unidadeService.listar(page, limit)
    res.json(resultado)
  },

  async buscarPorId(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const unidade = await unidadeService.buscarPorId(id)
    res.json(unidade)
  },

  async criar(req: Request, res: Response) {
    const dados = unidadeSchema.parse(req.body ?? {})
    const unidade = await unidadeService.criar(dados, req.usuario!)
    res.status(201).json(unidade)
  },

  async atualizar(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const dados = unidadeSchema.parse(req.body ?? {})
    const unidade = await unidadeService.atualizar(id, dados, req.usuario!)
    res.json(unidade)
  },

  async remover(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    await unidadeService.remover(id, req.usuario!)
    res.status(204).send()
  }
}
