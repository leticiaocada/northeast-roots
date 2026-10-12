import { Request, Response } from 'express'
import { fidelidadeService } from '../../application/services/fidelidadeService'
import { paginacaoSchema } from '../validacoes/comuns'
import { consentimentoSchema } from '../validacoes/fidelidadeValidacoes'

export const fidelidadeController = {
  async consultarSaldo(req: Request, res: Response) {
    const saldo = await fidelidadeService.consultarSaldo(req.usuario!)
    res.json(saldo)
  },

  async listarHistorico(req: Request, res: Response) {
    const { page, limit } = paginacaoSchema.parse(req.query)
    const resultado = await fidelidadeService.listarHistorico(req.usuario!, page, limit)
    res.json(resultado)
  },

  async atualizarConsentimento(req: Request, res: Response) {
    const { consentimento } = consentimentoSchema.parse(req.body ?? {})
    const saldo = await fidelidadeService.atualizarConsentimento(req.usuario!, consentimento)
    res.json(saldo)
  }
}
