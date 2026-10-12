import { Router } from 'express'
import { usuarioController } from '../controllers/usuarioController'
import { autenticar } from '../middlewares/autenticar'
import { autorizar } from '../middlewares/autorizar'

export const usuarioRotas = Router()

usuarioRotas.post('/', usuarioController.cadastrarCliente)
usuarioRotas.get('/me', autenticar, usuarioController.buscarMeusDados)
usuarioRotas.delete('/me', autenticar, autorizar('CLIENTE'), usuarioController.anonimizarConta)
usuarioRotas.get('/', autenticar, autorizar('ADMIN'), usuarioController.listar)
usuarioRotas.post('/funcionarios', autenticar, autorizar('ADMIN'), usuarioController.cadastrarFuncionario)
