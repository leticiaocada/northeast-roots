import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'

export function gerarRequestId(req: Request, res: Response, next: NextFunction) {
  const requestId = req.header('x-request-id') || randomUUID()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)
  next()
}
