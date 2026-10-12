import bcrypt from 'bcryptjs'

export function gerarHashSenha(senha: string) {
  return bcrypt.hash(senha, 10)
}

export function compararSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash)
}
