import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { estaDisponivel } from '../../domain/estoque'
import { UsuarioLogado } from '../../domain/usuario'
import { estoqueRepositorio } from '../../infrastructure/repositorios/estoqueRepositorio'
import { unidadeRepositorio } from '../../infrastructure/repositorios/unidadeRepositorio'
import { calcularPulo, montarPaginacao } from '../paginacao'
import { auditoriaService } from './auditoriaService'

type DadosUnidade = {
  nome: string
  cep: string
  cidade: string
  estado: string
}

async function buscarUnidadeAtiva(id: number) {
  const unidade = await unidadeRepositorio.buscarPorId(id)

  if (!unidade || !unidade.ativa) {
    throw new ErroAplicacao(404, 'UNIDADE_NAO_ENCONTRADA', 'Unidade não encontrada.', [
      { field: 'unidadeId', issue: `Unidade ${id} não existe ou está inativa.` }
    ])
  }

  return unidade
}

export const unidadeService = {
  buscarUnidadeAtiva,

  async listar(pagina: number, limite: number) {
    const unidades = await unidadeRepositorio.listarAtivas(calcularPulo(pagina, limite), limite)
    const total = await unidadeRepositorio.contarAtivas()

    return {
      dados: unidades,
      paginacao: montarPaginacao(pagina, limite, total)
    }
  },

  buscarPorId(id: number) {
    return buscarUnidadeAtiva(id)
  },

  async buscarCardapio(id: number) {
    const unidade = await buscarUnidadeAtiva(id)
    const estoques = await estoqueRepositorio.listarCardapio(id)

    return {
      unidade: { id: unidade.id, nome: unidade.nome },
      itens: estoques.map((estoque) => ({
        produtoId: estoque.produtoId,
        nome: estoque.produto.nome,
        descricao: estoque.produto.descricao,
        categoria: estoque.produto.categoria,
        preco: Number(estoque.produto.preco),
        disponivel: estaDisponivel(estoque.quantidade),
        quantidadeDisponivel: estoque.quantidade
      }))
    }
  },

  async criar(dados: DadosUnidade, usuarioLogado: UsuarioLogado) {
    const unidade = await unidadeRepositorio.criar(dados)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'UNIDADE_CRIADA',
      entidade: 'unidade',
      entidadeId: unidade.id
    })

    return unidade
  },

  async atualizar(id: number, dados: DadosUnidade, usuarioLogado: UsuarioLogado) {
    await buscarUnidadeAtiva(id)
    const unidade = await unidadeRepositorio.atualizar(id, dados)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'UNIDADE_ATUALIZADA',
      entidade: 'unidade',
      entidadeId: unidade.id
    })

    return unidade
  },

  async remover(id: number, usuarioLogado: UsuarioLogado) {
    await buscarUnidadeAtiva(id)
    await unidadeRepositorio.desativar(id)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'UNIDADE_DESATIVADA',
      entidade: 'unidade',
      entidadeId: id
    })
  }
}
