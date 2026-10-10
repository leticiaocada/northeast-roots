import { ErroAplicacao } from '../domain/ErroAplicacao'
import { UsuarioLogado } from '../domain/usuario'

export function verificarAcessoUnidade(usuario: UsuarioLogado, unidadeId: number) {
  if (usuario.perfil === 'ADMIN') {
    return
  }

  if (usuario.unidadeId !== unidadeId) {
    throw new ErroAplicacao(403, 'ACESSO_NEGADO', 'Você só pode acessar dados da sua unidade.')
  }
}
