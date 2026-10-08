import jwt from 'jsonwebtoken'
import { UsuarioLogado } from '../../domain/usuario'
import { config } from '../config'

export function gerarToken(usuario: UsuarioLogado) {
  return jwt.sign({ perfil: usuario.perfil, unidadeId: usuario.unidadeId }, config.jwtSegredo, {
    subject: String(usuario.id),
    expiresIn: config.jwtExpiracaoSegundos
  })
}

export function verificarToken(token: string): UsuarioLogado {
  const conteudo = jwt.verify(token, config.jwtSegredo) as jwt.JwtPayload

  return {
    id: Number(conteudo.sub),
    perfil: conteudo.perfil,
    unidadeId: conteudo.unidadeId ?? null
  }
}
