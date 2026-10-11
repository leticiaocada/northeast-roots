import { Router } from 'express'
import { pedidoController } from '../controllers/pedidoController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const pedidoRotas = Router()

pedidoRotas.use(autenticar)

pedidoRotas.post('/', autorizar('CLIENTE', 'ATENDENTE', 'GERENTE', 'ADMIN'), pedidoController.criar)
pedidoRotas.get('/', pedidoController.listar)
pedidoRotas.get('/:id', pedidoController.buscarPorId)
pedidoRotas.patch('/:id/status', autorizar('COZINHA', 'ATENDENTE', 'GERENTE', 'ADMIN'), pedidoController.atualizarStatus)
pedidoRotas.patch('/:id/cancelar', autorizar('CLIENTE', 'ATENDENTE', 'GERENTE', 'ADMIN'), pedidoController.cancelar)
