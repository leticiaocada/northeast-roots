import { Router } from 'express'
import { estoqueController } from '../controllers/estoqueController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const estoqueRotas = Router()

estoqueRotas.use(autenticar, autorizar('GERENTE', 'ADMIN'))

estoqueRotas.get('/', estoqueController.consultar)
estoqueRotas.get('/movimentacoes', estoqueController.listarMovimentacoes)
estoqueRotas.post('/entradas', estoqueController.registrarEntrada)
estoqueRotas.post('/saidas', estoqueController.registrarSaida)
