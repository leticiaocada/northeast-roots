import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { temQuantidadeSuficiente } from '../../domain/estoque'
import { UsuarioLogado } from '../../domain/usuario'
import { executarTransacao } from '../../infrastructure/banco/prisma'
import { estoqueRepositorio } from '../../infrastructure/repositorios/estoqueRepositorio'
import { calcularPulo, montarPaginacao } from '../paginacao'
import { verificarAcessoUnidade } from '../permissoes'
import { auditoriaService } from './auditoriaService'
import { produtoService } from './produtoService'
import { unidadeService } from './unidadeService'

type DadosMovimentacao = {
  unidadeId: number
  produtoId: number
  quantidade: number
  motivo: string
}

export const estoqueService = {
  async consultarPorUnidade(unidadeId: number, pagina: number, limite: number, usuarioLogado: UsuarioLogado) {
    verificarAcessoUnidade(usuarioLogado, unidadeId)
    await unidadeService.buscarUnidadeAtiva(unidadeId)

    const estoques = await estoqueRepositorio.listarPorUnidade(unidadeId, calcularPulo(pagina, limite), limite)
    const total = await estoqueRepositorio.contarPorUnidade(unidadeId)

    return {
      dados: estoques.map((estoque) => ({
        estoqueId: estoque.id,
        unidadeId: estoque.unidadeId,
        produtoId: estoque.produtoId,
        produto: estoque.produto.nome,
        quantidade: estoque.quantidade,
        atualizadoEm: estoque.atualizadoEm
      })),
      paginacao: montarPaginacao(pagina, limite, total)
    }
  },

  async registrarEntrada(dados: DadosMovimentacao, usuarioLogado: UsuarioLogado) {
    verificarAcessoUnidade(usuarioLogado, dados.unidadeId)
    await unidadeService.buscarUnidadeAtiva(dados.unidadeId)
    await produtoService.buscarProdutoAtivo(dados.produtoId)

    return executarTransacao(async (tx) => {
      const estoque = await estoqueRepositorio.adicionar(dados.unidadeId, dados.produtoId, dados.quantidade, tx)
      const movimentacao = await estoqueRepositorio.registrarMovimentacao(
        {
          estoqueId: estoque.id,
          tipo: 'ENTRADA',
          quantidade: dados.quantidade,
          motivo: dados.motivo,
          usuarioId: usuarioLogado.id
        },
        tx
      )

      await auditoriaService.registrar(
        {
          usuarioId: usuarioLogado.id,
          acao: 'ESTOQUE_ENTRADA',
          entidade: 'estoque',
          entidadeId: estoque.id,
          detalhes: { produtoId: dados.produtoId, quantidade: dados.quantidade, saldo: estoque.quantidade }
        },
        tx
      )

      return { movimentacaoId: movimentacao.id, tipo: movimentacao.tipo, estoqueId: estoque.id, saldoAtual: estoque.quantidade }
    })
  },

  async registrarSaida(dados: DadosMovimentacao, usuarioLogado: UsuarioLogado) {
    verificarAcessoUnidade(usuarioLogado, dados.unidadeId)
    await unidadeService.buscarUnidadeAtiva(dados.unidadeId)
    await produtoService.buscarProdutoAtivo(dados.produtoId)

    const estoque = await estoqueRepositorio.buscar(dados.unidadeId, dados.produtoId)
    const disponivel = estoque ? estoque.quantidade : 0

    if (!estoque || !temQuantidadeSuficiente(disponivel, dados.quantidade)) {
      throw new ErroAplicacao(409, 'ESTOQUE_INSUFICIENTE', 'Não há quantidade suficiente em estoque para esta saída.', [
        { field: 'quantidade', issue: `Disponível: ${disponivel}` }
      ])
    }

    return executarTransacao(async (tx) => {
      const conseguiuRetirar = await estoqueRepositorio.retirar(estoque.id, dados.quantidade, tx)

      if (!conseguiuRetirar) {
        throw new ErroAplicacao(409, 'ESTOQUE_INSUFICIENTE', 'Não há quantidade suficiente em estoque para esta saída.')
      }

      const movimentacao = await estoqueRepositorio.registrarMovimentacao(
        {
          estoqueId: estoque.id,
          tipo: 'SAIDA',
          quantidade: dados.quantidade,
          motivo: dados.motivo,
          usuarioId: usuarioLogado.id
        },
        tx
      )

      const saldoAtual = estoque.quantidade - dados.quantidade

      await auditoriaService.registrar(
        {
          usuarioId: usuarioLogado.id,
          acao: 'ESTOQUE_SAIDA',
          entidade: 'estoque',
          entidadeId: estoque.id,
          detalhes: { produtoId: dados.produtoId, quantidade: dados.quantidade, motivo: dados.motivo }
        },
        tx
      )

      return { movimentacaoId: movimentacao.id, tipo: movimentacao.tipo, estoqueId: estoque.id, saldoAtual }
    })
  },

  async listarMovimentacoes(unidadeId: number, pagina: number, limite: number, usuarioLogado: UsuarioLogado) {
    verificarAcessoUnidade(usuarioLogado, unidadeId)

    const movimentacoes = await estoqueRepositorio.listarMovimentacoes(unidadeId, calcularPulo(pagina, limite), limite)
    const total = await estoqueRepositorio.contarMovimentacoes(unidadeId)

    return {
      dados: movimentacoes.map((movimentacao) => ({
        id: movimentacao.id,
        tipo: movimentacao.tipo,
        produtoId: movimentacao.estoque.produtoId,
        produto: movimentacao.estoque.produto.nome,
        quantidade: movimentacao.quantidade,
        motivo: movimentacao.motivo,
        pedidoId: movimentacao.pedidoId,
        usuarioId: movimentacao.usuarioId,
        criadoEm: movimentacao.criadoEm
      })),
      paginacao: montarPaginacao(pagina, limite, total)
    }
  }
}
