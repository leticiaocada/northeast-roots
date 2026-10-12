import { NextFunction, Request, Response } from 'express'
import { DetalheErro, ErroAplicacao } from '../../domain/ErroAplicacao'
import { logger } from '../../infrastructure/logger'

function montarErro(req: Request, codigo: string, mensagem: string, detalhes: DetalheErro[] = []) {
  return {
    error: codigo,
    message: mensagem,
    details: detalhes,
    timestamp: new Date().toISOString(),
    path: req.originalUrl.split('?')[0],
    requestId: req.requestId
  }
}

export function rotaNaoEncontrada(req: Request, res: Response) {
  res.status(404).json(montarErro(req, 'ROTA_NAO_ENCONTRADA', 'A rota informada não existe.'))
}

export function tratarErros(erro: any, req: Request, res: Response, next: NextFunction) {
  if (erro instanceof ErroAplicacao) {
    res.status(erro.status).json(montarErro(req, erro.codigo, erro.message, erro.detalhes))
    return
  }

  if (erro.type === 'entity.parse.failed') {
    res.status(400).json(montarErro(req, 'JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.'))
    return
  }

  logger.erro('erro inesperado', { mensagem: erro.message, requestId: req.requestId })
  res.status(500).json(montarErro(req, 'ERRO_INTERNO', 'Ocorreu um erro inesperado. Tente novamente mais tarde.'))
}
