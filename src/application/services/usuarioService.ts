import { randomUUID } from 'crypto'
import { Cliente, Usuario } from '@prisma/client'
import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { Perfil } from '../../domain/enums'
import { gerarDadosAnonimizados, mascararEmail, UsuarioLogado } from '../../domain/usuario'
import { unidadeRepositorio } from '../../infrastructure/repositorios/unidadeRepositorio'
import { usuarioRepositorio } from '../../infrastructure/repositorios/usuarioRepositorio'
import { gerarHashSenha } from '../../infrastructure/seguranca/senha'
import { calcularPulo, montarPaginacao } from '../paginacao'
import { auditoriaService } from './auditoriaService'

type DadosCadastroCliente = {
  nome: string
  email: string
  senha: string
  telefone?: string
  consentimentoFidelidade: boolean
}

type DadosCadastroFuncionario = {
  nome: string
  email: string
  senha: string
  perfil: Perfil
  unidadeId?: number
}

function formatarUsuario(usuario: Usuario & { cliente: Cliente | null }) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    unidadeId: usuario.unidadeId,
    criadoEm: usuario.criadoEm,
    cliente: usuario.cliente
      ? {
          id: usuario.cliente.id,
          telefone: usuario.cliente.telefone,
          pontosFidelidade: usuario.cliente.pontosFidelidade,
          consentimentoFidelidade: usuario.cliente.consentimentoFidelidade,
          dataConsentimento: usuario.cliente.dataConsentimento
        }
      : null
  }
}

async function verificarEmailDisponivel(email: string) {
  const usuarioExistente = await usuarioRepositorio.buscarPorEmail(email)

  if (usuarioExistente) {
    throw new ErroAplicacao(409, 'EMAIL_JA_CADASTRADO', 'Já existe um usuário com este e-mail.', [
      { field: 'email', issue: 'E-mail já cadastrado.' }
    ])
  }
}

export const usuarioService = {
  async cadastrarCliente(dados: DadosCadastroCliente) {
    await verificarEmailDisponivel(dados.email)

    const senhaHash = await gerarHashSenha(dados.senha)
    const usuario = await usuarioRepositorio.criarCliente({
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      telefone: dados.telefone,
      consentimentoFidelidade: dados.consentimentoFidelidade
    })

    await auditoriaService.registrar({
      usuarioId: usuario.id,
      acao: 'CLIENTE_CADASTRADO',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: { email: mascararEmail(usuario.email), consentimentoFidelidade: dados.consentimentoFidelidade }
    })

    return formatarUsuario(usuario)
  },

  async cadastrarFuncionario(dados: DadosCadastroFuncionario, usuarioLogado: UsuarioLogado) {
    await verificarEmailDisponivel(dados.email)

    if (dados.unidadeId) {
      const unidade = await unidadeRepositorio.buscarPorId(dados.unidadeId)
      if (!unidade) {
        throw new ErroAplicacao(404, 'UNIDADE_NAO_ENCONTRADA', 'Unidade não encontrada.', [
          { field: 'unidadeId', issue: `Unidade ${dados.unidadeId} não existe.` }
        ])
      }
    }

    const senhaHash = await gerarHashSenha(dados.senha)
    const usuario = await usuarioRepositorio.criarFuncionario({
      nome: dados.nome,
      email: dados.email,
      senhaHash,
      perfil: dados.perfil,
      unidadeId: dados.unidadeId ?? null
    })

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'FUNCIONARIO_CADASTRADO',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: { perfil: usuario.perfil, unidadeId: usuario.unidadeId }
    })

    return formatarUsuario(usuario)
  },

  async buscarMeusDados(usuarioLogado: UsuarioLogado) {
    const usuario = await usuarioRepositorio.buscarPorId(usuarioLogado.id)

    if (!usuario || !usuario.ativo) {
      throw new ErroAplicacao(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.')
    }

    return formatarUsuario(usuario)
  },

  async listar(pagina: number, limite: number, usuarioLogado: UsuarioLogado) {
    const usuarios = await usuarioRepositorio.listar(calcularPulo(pagina, limite), limite)
    const total = await usuarioRepositorio.contar()

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'CONSULTA_DADOS_PESSOAIS',
      entidade: 'usuario',
      detalhes: { pagina, limite, quantidadeRetornada: usuarios.length }
    })

    return {
      dados: usuarios.map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        unidadeId: usuario.unidadeId,
        ativo: usuario.ativo
      })),
      paginacao: montarPaginacao(pagina, limite, total)
    }
  },

  async anonimizarConta(usuarioLogado: UsuarioLogado) {
    const usuario = await usuarioRepositorio.buscarPorId(usuarioLogado.id)

    if (!usuario || !usuario.ativo) {
      throw new ErroAplicacao(404, 'USUARIO_NAO_ENCONTRADO', 'Usuário não encontrado.')
    }

    const dadosAnonimos = gerarDadosAnonimizados(usuario.id)
    const senhaHash = await gerarHashSenha(randomUUID())

    await usuarioRepositorio.anonimizar(usuario.id, { ...dadosAnonimos, senhaHash })

    await auditoriaService.registrar({
      usuarioId: usuario.id,
      acao: 'CONTA_ANONIMIZADA',
      entidade: 'usuario',
      entidadeId: usuario.id
    })
  }
}
