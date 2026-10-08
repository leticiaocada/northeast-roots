import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import './api/validacoes/mensagensErro'
import { gerarRequestId } from './api/middlewares/gerarRequestId'
import { registrarLogRequisicao } from './api/middlewares/registrarLogRequisicao'
import { rotaNaoEncontrada, tratarErros } from './api/middlewares/tratarErros'
import { rotas } from './api/rotas'

export const app = express()

app.use(gerarRequestId)
app.use(registrarLogRequisicao)
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(rotas)
app.use(rotaNaoEncontrada)
app.use(tratarErros)
