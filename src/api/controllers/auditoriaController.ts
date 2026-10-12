import { Request, Response } from 'express'
import { auditoriaService } from '../../application/services/auditoriaService'
import { listarAuditoriaSchema } from '../validacoes/auditoriaValidacoes'

export const auditoriaController = {
  async listar(req: Request, res: Response) {
    const { page, limit, ...filtros } = listarAuditoriaSchema.parse(req.query)
    const resultado = await auditoriaService.listar(filtros, page, limit)
    res.json(resultado)
  }
}
