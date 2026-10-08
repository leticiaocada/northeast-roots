import { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
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

function formatarCampo(caminho: (string | number)[]) {
  let campo = ''

  for (const parte of caminho) {
    if (typeof parte === 'number') {
      campo += `[${parte}]`
    } else {
      campo += campo ? `.${parte}` : parte
    }
  }

  return campo
}

export function rotaNaoEncontrada(req: Request, res: Response) {
  res.status(404).json(montarErro(req, 'ROTA_NAO_ENCONTRADA', 'A rota informada não existe.'))
}

export function tratarErros(erro: any, req: Request, res: Response, next: NextFunction) {
  if (erro instanceof ErroAplicacao) {
    res.status(erro.status).json(montarErro(req, erro.codigo, erro.message, erro.detalhes))
    return
  }

  if (erro instanceof ZodError) {
    const detalhes = erro.issues.map((issue) => ({ field: formatarCampo(issue.path), issue: issue.message }))
    res.status(422).json(montarErro(req, 'VALIDACAO', 'Os dados enviados são inválidos.', detalhes))
    return
  }

  if (erro.type === 'entity.parse.failed') {
    res.status(400).json(montarErro(req, 'JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.'))
    return
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
    res.status(409).json(montarErro(req, 'REGISTRO_DUPLICADO', 'Já existe um registro com estes dados.'))
    return
  }

  logger.erro('erro inesperado', { mensagem: erro.message, requestId: req.requestId })
  res.status(500).json(montarErro(req, 'ERRO_INTERNO', 'Ocorreu um erro inesperado. Tente novamente mais tarde.'))
}
