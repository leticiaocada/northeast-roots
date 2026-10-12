import { Router } from 'express'
import { authController } from '../controllers/authController'
import { limitarTentativasLogin } from '../middlewares/limitarTentativasLogin'

export const authRotas = Router()

authRotas.post('/login', limitarTentativasLogin, authController.login)
