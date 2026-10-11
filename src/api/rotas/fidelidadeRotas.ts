import { Router } from 'express'
import { fidelidadeController } from '../controllers/fidelidadeController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const fidelidadeRotas = Router()

fidelidadeRotas.use(autenticar, autorizar('CLIENTE'))

fidelidadeRotas.get('/saldo', fidelidadeController.consultarSaldo)
fidelidadeRotas.get('/historico', fidelidadeController.listarHistorico)
fidelidadeRotas.patch('/consentimento', fidelidadeController.atualizarConsentimento)
