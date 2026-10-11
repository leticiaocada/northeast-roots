import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { UsuarioLogado } from '../../domain/usuario'
import { promocaoRepositorio } from '../../infrastructure/repositorios/promocaoRepositorio'
import { calcularPulo, montarPaginacao } from '../paginacao'
import { auditoriaService } from './auditoriaService'
import { produtoService } from './produtoService'
import { unidadeService } from './unidadeService'

type DadosPromocao = {
  nome: string
  produtoId: number
  unidadeId?: number
  percentualDesconto: number
  dataInicio: Date
  dataFim: Date
}

export const promocaoService = {
  buscarVigentesDaUnidade(unidadeId: number) {
    return promocaoRepositorio.listarVigentesDaUnidade(unidadeId, new Date())
  },

  async listarVigentes(pagina: number, limite: number) {
    const agora = new Date()
    const promocoes = await promocaoRepositorio.listarVigentes(agora, calcularPulo(pagina, limite), limite)
    const total = await promocaoRepositorio.contarVigentes(agora)

    return {
      dados: promocoes.map((promocao) => ({
        id: promocao.id,
        nome: promocao.nome,
        produtoId: promocao.produtoId,
        produto: promocao.produto.nome,
        unidadeId: promocao.unidadeId,
        percentualDesconto: promocao.percentualDesconto,
        dataInicio: promocao.dataInicio,
        dataFim: promocao.dataFim
      })),
      paginacao: montarPaginacao(pagina, limite, total)
    }
  },

  async criar(dados: DadosPromocao, usuarioLogado: UsuarioLogado) {
    await produtoService.buscarProdutoAtivo(dados.produtoId)

    if (dados.unidadeId) {
      await unidadeService.buscarUnidadeAtiva(dados.unidadeId)
    }

    const promocao = await promocaoRepositorio.criar(dados)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'PROMOCAO_CRIADA',
      entidade: 'promocao',
      entidadeId: promocao.id,
      detalhes: { produtoId: dados.produtoId, percentualDesconto: dados.percentualDesconto }
    })

    return promocao
  },

  async desativar(id: number, usuarioLogado: UsuarioLogado) {
    const promocao = await promocaoRepositorio.buscarPorId(id)

    if (!promocao) {
      throw new ErroAplicacao(404, 'PROMOCAO_NAO_ENCONTRADA', 'Promoção não encontrada.')
    }

    const promocaoDesativada = await promocaoRepositorio.desativar(id)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'PROMOCAO_DESATIVADA',
      entidade: 'promocao',
      entidadeId: id
    })

    return promocaoDesativada
  }
}
