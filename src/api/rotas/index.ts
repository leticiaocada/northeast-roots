import { Router } from 'express'
import { auditoriaRotas } from './auditoriaRotas'
import { authRotas } from './authRotas'
import { estoqueRotas } from './estoqueRotas'
import { pedidoRotas } from './pedidoRotas'
import { produtoRotas } from './produtoRotas'
import { unidadeRotas } from './unidadeRotas'
import { usuarioRotas } from './usuarioRotas'

export const rotas = Router()

rotas.get('/health', (req, res) => {
  res.json({ status: 'ok', data: new Date().toISOString() })
})

rotas.use('/auth', authRotas)
rotas.use('/usuarios', usuarioRotas)
rotas.use('/unidades', unidadeRotas)
rotas.use('/produtos', produtoRotas)
rotas.use('/estoque', estoqueRotas)
rotas.use('/pedidos', pedidoRotas)
rotas.use('/auditoria', auditoriaRotas)
