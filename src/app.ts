import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import './api/validacoes/mensagensErro'
import documentacao from './api/docs/openapi.json'
import { gerarRequestId } from './api/middlewares/gerarRequestId'
import { registrarLogRequisicao } from './api/middlewares/registrarLogRequisicao'
import { rotaNaoEncontrada, tratarErros } from './api/middlewares/tratarErros'
import { rotas } from './api/rotas'

export const app = express()

app.use(gerarRequestId)
app.use(registrarLogRequisicao)

app.get('/docs.json', (req, res) => {
  res.json(documentacao)
})
app.use('/docs', swaggerUi.serve, swaggerUi.setup(documentacao))

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(rotas)
app.use(rotaNaoEncontrada)
app.use(tratarErros)
