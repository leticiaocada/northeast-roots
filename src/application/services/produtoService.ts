import { Produto } from '@prisma/client'
import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { UsuarioLogado } from '../../domain/usuario'
import { produtoRepositorio } from '../../infrastructure/repositorios/produtoRepositorio'
import { calcularPulo, montarPaginacao } from '../paginacao'
import { auditoriaService } from './auditoriaService'

type DadosProduto = {
  nome: string
  descricao?: string
  preco: number
  categoria: string
}

function formatarProduto(produto: Produto) {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    preco: Number(produto.preco),
    categoria: produto.categoria,
    ativo: produto.ativo
  }
}

async function buscarProdutoAtivo(id: number) {
  const produto = await produtoRepositorio.buscarPorId(id)

  if (!produto || !produto.ativo) {
    throw new ErroAplicacao(404, 'PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.', [
      { field: 'produtoId', issue: `Produto ${id} não existe ou está inativo.` }
    ])
  }

  return produto
}

export const produtoService = {
  buscarProdutoAtivo,

  async listar(categoria: string | undefined, pagina: number, limite: number) {
    const produtos = await produtoRepositorio.listarAtivos({ categoria }, calcularPulo(pagina, limite), limite)
    const total = await produtoRepositorio.contarAtivos({ categoria })

    return {
      dados: produtos.map(formatarProduto),
      paginacao: montarPaginacao(pagina, limite, total)
    }
  },

  async buscarPorId(id: number) {
    const produto = await buscarProdutoAtivo(id)
    return formatarProduto(produto)
  },

  async criar(dados: DadosProduto, usuarioLogado: UsuarioLogado) {
    const produto = await produtoRepositorio.criar(dados)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'PRODUTO_CRIADO',
      entidade: 'produto',
      entidadeId: produto.id,
      detalhes: { preco: dados.preco }
    })

    return formatarProduto(produto)
  },

  async atualizar(id: number, dados: DadosProduto, usuarioLogado: UsuarioLogado) {
    const produtoAntigo = await buscarProdutoAtivo(id)
    const produto = await produtoRepositorio.atualizar(id, dados)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'PRODUTO_ATUALIZADO',
      entidade: 'produto',
      entidadeId: produto.id,
      detalhes: { precoAnterior: Number(produtoAntigo.preco), precoNovo: dados.preco }
    })

    return formatarProduto(produto)
  },

  async remover(id: number, usuarioLogado: UsuarioLogado) {
    await buscarProdutoAtivo(id)
    await produtoRepositorio.desativar(id)

    await auditoriaService.registrar({
      usuarioId: usuarioLogado.id,
      acao: 'PRODUTO_DESATIVADO',
      entidade: 'produto',
      entidadeId: id
    })
  }
}
