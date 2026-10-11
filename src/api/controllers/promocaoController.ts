import { Request, Response } from 'express'
import { promocaoService } from '../../application/services/promocaoService'
import { idParametroSchema, paginacaoSchema } from '../validacoes/comuns'
import { promocaoSchema } from '../validacoes/promocaoValidacoes'

export const promocaoController = {
  async listar(req: Request, res: Response) {
    const { page, limit } = paginacaoSchema.parse(req.query)
    const resultado = await promocaoService.listarVigentes(page, limit)
    res.json(resultado)
  },

  async criar(req: Request, res: Response) {
    const dados = promocaoSchema.parse(req.body ?? {})
    const promocao = await promocaoService.criar(dados, req.usuario!)
    res.status(201).json(promocao)
  },

  async desativar(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const promocao = await promocaoService.desativar(id, req.usuario!)
    res.json(promocao)
  }
}
