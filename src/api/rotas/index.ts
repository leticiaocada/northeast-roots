import { Router } from 'express'

export const rotas = Router()

rotas.get('/health', (req, res) => {
  res.json({ status: 'ok', data: new Date().toISOString() })
})
