import { UsuarioLogado } from '../../domain/usuario'

declare global {
  namespace Express {
    interface Request {
      requestId?: string
      usuario?: UsuarioLogado
    }
  }
}

export {}
