import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { config } from '../../infrastructure/config'
import { usuarioRepositorio } from '../../infrastructure/repositorios/usuarioRepositorio'
import { compararSenha } from '../../infrastructure/seguranca/senha'
import { gerarToken } from '../../infrastructure/seguranca/token'
import { auditoriaService } from './auditoriaService'

export const authService = {
  async login(email: string, senha: string) {
    const usuario = await usuarioRepositorio.buscarPorEmail(email)
    const senhaCorreta = usuario ? await compararSenha(senha, usuario.senhaHash) : false

    if (!usuario || !usuario.ativo || !senhaCorreta) {
      throw new ErroAplicacao(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.')
    }

    const accessToken = gerarToken({ id: usuario.id, perfil: usuario.perfil, unidadeId: usuario.unidadeId })

    await auditoriaService.registrar({ usuarioId: usuario.id, acao: 'LOGIN', entidade: 'usuario', entidadeId: usuario.id })

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: config.jwtExpiracaoSegundos,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        unidadeId: usuario.unidadeId
      }
    }
  }
}
