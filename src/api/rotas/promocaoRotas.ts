import { Router } from 'express'
import { promocaoController } from '../controllers/promocaoController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const promocaoRotas = Router()

promocaoRotas.get('/', promocaoController.listar)
promocaoRotas.post('/', autenticar, autorizar('ADMIN'), promocaoController.criar)
promocaoRotas.patch('/:id/desativar', autenticar, autorizar('ADMIN'), promocaoController.desativar)
