import { NextFunction, Request, Response } from 'express'
import { logger } from '../../infrastructure/logger'

export function registrarLogRequisicao(req: Request, res: Response, next: NextFunction) {
  const inicio = Date.now()

  res.on('finish', () => {
    logger.info('requisicao', {
      metodo: req.method,
      rota: req.originalUrl,
      status: res.statusCode,
      duracaoMs: Date.now() - inicio,
      requestId: req.requestId
    })
  })

  next()
}
