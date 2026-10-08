import { NextFunction, Request, Response } from 'express'
import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { Perfil } from '../../domain/enums'

export function autorizar(...perfis: Perfil[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      throw new ErroAplicacao(403, 'ACESSO_NEGADO', 'Seu perfil não tem permissão para acessar este recurso.')
    }

    next()
  }
}
