import rateLimit from 'express-rate-limit'
import { ErroAplicacao } from '../../domain/ErroAplicacao'

export const limitarTentativasLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ErroAplicacao(429, 'MUITAS_TENTATIVAS', 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'))
  }
})
