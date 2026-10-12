import { Request, Response } from 'express'
import { produtoService } from '../../application/services/produtoService'
import { idParametroSchema } from '../validacoes/comuns'
import { listarProdutosSchema, produtoSchema } from '../validacoes/produtoValidacoes'

export const produtoController = {
  async listar(req: Request, res: Response) {
    const { page, limit, categoria } = listarProdutosSchema.parse(req.query)
    const resultado = await produtoService.listar(categoria, page, limit)
    res.json(resultado)
  },

  async buscarPorId(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const produto = await produtoService.buscarPorId(id)
    res.json(produto)
  },

  async criar(req: Request, res: Response) {
    const dados = produtoSchema.parse(req.body ?? {})
    const produto = await produtoService.criar(dados, req.usuario!)
    res.status(201).json(produto)
  },

  async atualizar(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    const dados = produtoSchema.parse(req.body ?? {})
    const produto = await produtoService.atualizar(id, dados, req.usuario!)
    res.json(produto)
  },

  async remover(req: Request, res: Response) {
    const { id } = idParametroSchema.parse(req.params)
    await produtoService.remover(id, req.usuario!)
    res.status(204).send()
  }
}
