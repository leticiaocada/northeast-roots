import { Router } from 'express'
import { authRotas } from './authRotas'

export const rotas = Router()

rotas.get('/health', (req, res) => {
  res.json({ status: 'ok', data: new Date().toISOString() })
})

rotas.use('/auth', authRotas)
