import { app } from './app'
import { config } from './infrastructure/config'
import { logger } from './infrastructure/logger'

app.listen(config.porta, () => {
  logger.info(`API rodando na porta ${config.porta}`)
})
