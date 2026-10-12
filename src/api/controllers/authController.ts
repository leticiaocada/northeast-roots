import { Request, Response } from 'express'
import { authService } from '../../application/services/authService'
import { loginSchema } from '../validacoes/usuarioValidacoes'

export const authController = {
  async login(req: Request, res: Response) {
    const dados = loginSchema.parse(req.body ?? {})
    const resultado = await authService.login(dados.email, dados.senha)
    res.json(resultado)
  }
}
