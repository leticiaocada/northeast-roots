import { NextFunction, Request, Response } from 'express'
import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { verificarToken } from '../../infrastructure/seguranca/token'

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.header('authorization')

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    throw new ErroAplicacao(401, 'TOKEN_AUSENTE', 'É necessário enviar o token de acesso no cabeçalho Authorization.')
  }

  try {
    req.usuario = verificarToken(cabecalho.replace('Bearer ', ''))
  } catch {
    throw new ErroAplicacao(401, 'TOKEN_INVALIDO', 'Token inválido ou expirado.')
  }

  next()
}
