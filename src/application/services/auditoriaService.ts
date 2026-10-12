import { Transacao } from '../../infrastructure/banco/prisma'
import { auditoriaRepositorio } from '../../infrastructure/repositorios/auditoriaRepositorio'
import { calcularPulo, montarPaginacao } from '../paginacao'

type RegistroAuditoria = {
  usuarioId: number | null
  acao: string
  entidade: string
  entidadeId?: number | null
  detalhes?: Record<string, string | number | boolean | null>
}

type FiltrosAuditoria = {
  acao?: string
  entidade?: string
  entidadeId?: number
}

export const auditoriaService = {
  registrar(registro: RegistroAuditoria, tx?: Transacao) {
    return auditoriaRepositorio.criar(registro, tx)
  },

  async listar(filtros: FiltrosAuditoria, pagina: number, limite: number) {
    const logs = await auditoriaRepositorio.listar(filtros, calcularPulo(pagina, limite), limite)
    const total = await auditoriaRepositorio.contar(filtros)

    return {
      dados: logs,
      paginacao: montarPaginacao(pagina, limite, total)
    }
  }
}
