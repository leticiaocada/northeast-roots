import { Router } from 'express'
import { pagamentoController } from '../controllers/pagamentoController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const pagamentoRotas = Router()

pagamentoRotas.use(autenticar, autorizar('CLIENTE', 'ATENDENTE', 'GERENTE', 'ADMIN'))

pagamentoRotas.post('/', pagamentoController.solicitar)
pagamentoRotas.get('/', pagamentoController.listarPorPedido)
