import { Router } from 'express'
import { auditoriaController } from '../controllers/auditoriaController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const auditoriaRotas = Router()

auditoriaRotas.get('/', autenticar, autorizar('ADMIN'), auditoriaController.listar)
