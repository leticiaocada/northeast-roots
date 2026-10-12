import { Router } from 'express'
import { produtoController } from '../controllers/produtoController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const produtoRotas = Router()

produtoRotas.get('/', produtoController.listar)
produtoRotas.get('/:id', produtoController.buscarPorId)
produtoRotas.post('/', autenticar, autorizar('ADMIN'), produtoController.criar)
produtoRotas.put('/:id', autenticar, autorizar('ADMIN'), produtoController.atualizar)
produtoRotas.delete('/:id', autenticar, autorizar('ADMIN'), produtoController.remover)
