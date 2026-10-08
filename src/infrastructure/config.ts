import 'dotenv/config'

export const config = {
  porta: Number(process.env.PORT) || 3000,
  jwtSegredo: process.env.JWT_SECRET || 'segredo-apenas-para-desenvolvimento',
  jwtExpiracaoSegundos: Number(process.env.JWT_EXPIRES_IN) || 3600
}
