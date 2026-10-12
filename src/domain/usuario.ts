import { Perfil } from './enums'

export type UsuarioLogado = {
  id: number
  perfil: Perfil
  unidadeId: number | null
}

export function mascararEmail(email: string) {
  const [nome, dominio] = email.split('@')
  return `${nome.slice(0, 2)}***@${dominio}`
}

export function gerarDadosAnonimizados(usuarioId: number) {
  return {
    nome: 'Usuário anonimizado',
    email: `anonimizado-${usuarioId}@anonimizado.local`
  }
}
