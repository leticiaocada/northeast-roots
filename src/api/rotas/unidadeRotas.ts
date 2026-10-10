import { Router } from 'express'
import { unidadeController } from '../controllers/unidadeController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const unidadeRotas = Router()

unidadeRotas.get('/', unidadeController.listar)
unidadeRotas.get('/:id', unidadeController.buscarPorId)
unidadeRotas.get('/:id/cardapio', unidadeController.buscarCardapio)
unidadeRotas.post('/', autenticar, autorizar('ADMIN'), unidadeController.criar)
unidadeRotas.put('/:id', autenticar, autorizar('ADMIN'), unidadeController.atualizar)
unidadeRotas.delete('/:id', autenticar, autorizar('ADMIN'), unidadeController.remover)
