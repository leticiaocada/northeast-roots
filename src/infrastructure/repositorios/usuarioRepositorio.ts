import { Perfil } from '../../domain/enums'
import { prisma } from '../banco/prisma'

type DadosNovoCliente = {
  nome: string
  email: string
  senhaHash: string
  telefone?: string
  consentimentoFidelidade: boolean
}

type DadosNovoFuncionario = {
  nome: string
  email: string
  senhaHash: string
  perfil: Perfil
  unidadeId: number | null
}

type DadosAnonimizacao = {
  nome: string
  email: string
  senhaHash: string
}

export const usuarioRepositorio = {
  buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email }, include: { cliente: true } })
  },

  buscarPorId(id: number) {
    return prisma.usuario.findUnique({ where: { id }, include: { cliente: true } })
  },

  criarCliente(dados: DadosNovoCliente) {
    return prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senhaHash: dados.senhaHash,
        perfil: 'CLIENTE',
        cliente: {
          create: {
            telefone: dados.telefone,
            consentimentoFidelidade: dados.consentimentoFidelidade,
            dataConsentimento: dados.consentimentoFidelidade ? new Date() : null
          }
        }
      },
      include: { cliente: true }
    })
  },

  criarFuncionario(dados: DadosNovoFuncionario) {
    return prisma.usuario.create({ data: dados, include: { cliente: true } })
  },

  listar(pular: number, quantidade: number) {
    return prisma.usuario.findMany({ skip: pular, take: quantidade, orderBy: { id: 'asc' } })
  },

  contar() {
    return prisma.usuario.count()
  },

  anonimizar(id: number, dados: DadosAnonimizacao) {
    return prisma.usuario.update({
      where: { id },
      data: {
        nome: dados.nome,
        email: dados.email,
        senhaHash: dados.senhaHash,
        ativo: false,
        anonimizadoEm: new Date(),
        cliente: {
          update: { telefone: null, consentimentoFidelidade: false, dataConsentimento: new Date() }
        }
      }
    })
  }
}
