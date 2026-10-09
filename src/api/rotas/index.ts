import { Router } from 'express'
import { authRotas } from './authRotas'
import { usuarioRotas } from './usuarioRotas'

export const rotas = Router()

rotas.get('/health', (req, res) => {
  res.json({ status: 'ok', data: new Date().toISOString() })
})

rotas.use('/auth', authRotas)
rotas.use('/usuarios', usuarioRotas)
