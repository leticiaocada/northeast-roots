import { Request, Response } from 'express'
import { usuarioService } from '../../application/services/usuarioService'
import { paginacaoSchema } from '../validacoes/comuns'
import { cadastroClienteSchema, cadastroFuncionarioSchema } from '../validacoes/usuarioValidacoes'

export const usuarioController = {
  async cadastrarCliente(req: Request, res: Response) {
    const dados = cadastroClienteSchema.parse(req.body ?? {})
    const usuario = await usuarioService.cadastrarCliente(dados)
    res.status(201).json(usuario)
  },

  async cadastrarFuncionario(req: Request, res: Response) {
    const dados = cadastroFuncionarioSchema.parse(req.body ?? {})
    const usuario = await usuarioService.cadastrarFuncionario(dados, req.usuario!)
    res.status(201).json(usuario)
  },

  async buscarMeusDados(req: Request, res: Response) {
    const usuario = await usuarioService.buscarMeusDados(req.usuario!)
    res.json(usuario)
  },

  async listar(req: Request, res: Response) {
    const { page, limit } = paginacaoSchema.parse(req.query)
    const resultado = await usuarioService.listar(page, limit, req.usuario!)
    res.json(resultado)
  },

  async anonimizarConta(req: Request, res: Response) {
    await usuarioService.anonimizarConta(req.usuario!)
    res.status(204).send()
  }
}
