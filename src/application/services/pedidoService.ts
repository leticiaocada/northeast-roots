import { DetalheErro, ErroAplicacao } from '../../domain/ErroAplicacao'
import { paraCentavos, paraReais } from '../../domain/dinheiro'
import { CanalPedido, FormaPagamento, StatusPedido } from '../../domain/enums'
import { temQuantidadeSuficiente } from '../../domain/estoque'
import { calcularDescontoDosPontos, validarResgateDePontos } from '../../domain/fidelidade'
import { calcularValoresDoPedido, podeSerCancelado, validarMudancaDeStatus } from '../../domain/pedido'
import { calcularDescontoPromocional, escolherMelhorPromocao } from '../../domain/promocao'
import { UsuarioLogado } from '../../domain/usuario'
import { executarTransacao } from '../../infrastructure/banco/prisma'
import { clienteRepositorio } from '../../infrastructure/repositorios/clienteRepositorio'
import { estoqueRepositorio } from '../../infrastructure/repositorios/estoqueRepositorio'
import { pagamentoRepositorio } from '../../infrastructure/repositorios/pagamentoRepositorio'
import { pedidoRepositorio } from '../../infrastructure/repositorios/pedidoRepositorio'
import { produtoRepositorio } from '../../infrastructure/repositorios/produtoRepositorio'
import { calcularPulo, montarPaginacao } from '../paginacao'
import { verificarAcessoUnidade } from '../permissoes'
import { auditoriaService } from './auditoriaService'
import { fidelidadeService } from './fidelidadeService'
import { promocaoService } from './promocaoService'
import { unidadeService } from './unidadeService'

type DadosNovoPedido = {
  unidadeId: number
  canalPedido: CanalPedido
  clienteId?: number
  formaPagamento: FormaPagamento
  observacao?: string
  pontosResgatados?: number
  itens: { produtoId: number; quantidade: number }[]
}

type ItemDoPedido = {
  produtoId: number
  estoqueId: number
  quantidade: number
  precoCentavos: number
  descontoCentavos: number
  promocaoId: number | null
}

type FiltrosListagem = {
  canalPedido?: CanalPedido
  status?: StatusPedido
  unidadeId?: number
}

type PedidoCompleto = NonNullable<Awaited<ReturnType<typeof pedidoRepositorio.buscarPorId>>>

function formatarPedido(pedido: PedidoCompleto) {
  return {
    id: pedido.id,
    unidadeId: pedido.unidadeId,
    clienteId: pedido.clienteId,
    canalPedido: pedido.canalPedido,
    status: pedido.status,
    formaPagamento: pedido.formaPagamento,
    subtotal: Number(pedido.subtotal),
    desconto: Number(pedido.desconto),
    total: Number(pedido.total),
    pontosUsados: pedido.pontosUsados,
    observacao: pedido.observacao,
    itens: pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.produto.nome,
      quantidade: item.quantidade,
      precoUnitario: Number(item.precoUnitario),
      desconto: Number(item.desconto),
      promocaoId: item.promocaoId
    })),
    criadoPorId: pedido.criadoPorId,
    criadoEm: pedido.criadoEm,
    atualizadoEm: pedido.atualizadoEm
  }
}

async function buscarClienteDoPedido(clienteIdInformado: number | undefined, usuario: UsuarioLogado) {
  if (usuario.perfil === 'CLIENTE') {
    const cliente = await clienteRepositorio.buscarPorUsuarioId(usuario.id)

    if (!cliente) {
      throw new ErroAplicacao(404, 'CLIENTE_NAO_ENCONTRADO', 'Cadastro de cliente não encontrado para este usuário.')
    }

    return cliente
  }

  if (!clienteIdInformado) {
    return null
  }

  const cliente = await clienteRepositorio.buscarPorId(clienteIdInformado)

  if (!cliente) {
    throw new ErroAplicacao(404, 'CLIENTE_NAO_ENCONTRADO', 'Cliente não encontrado.', [
      { field: 'clienteId', issue: `Cliente ${clienteIdInformado} não existe.` }
    ])
  }

  return cliente
}

async function buscarPedidoComAcesso(id: number, usuario: UsuarioLogado) {
  const pedido = await pedidoRepositorio.buscarPorId(id)

  if (!pedido) {
    throw new ErroAplicacao(404, 'PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.', [
      { field: 'id', issue: `Pedido ${id} não existe.` }
    ])
  }

  if (usuario.perfil === 'CLIENTE') {
    const cliente = await clienteRepositorio.buscarPorUsuarioId(usuario.id)

    if (!cliente || pedido.clienteId !== cliente.id) {
      throw new ErroAplicacao(403, 'ACESSO_NEGADO', 'Você só pode acessar os seus próprios pedidos.')
    }
  } else {
    verificarAcessoUnidade(usuario, pedido.unidadeId)
  }

  return pedido
}

export const pedidoService = {
  buscarPedidoComAcesso,

  async criar(dados: DadosNovoPedido, usuario: UsuarioLogado) {
    await unidadeService.buscarUnidadeAtiva(dados.unidadeId)

    if (usuario.perfil !== 'CLIENTE') {
      verificarAcessoUnidade(usuario, dados.unidadeId)
    }

    const cliente = await buscarClienteDoPedido(dados.clienteId, usuario)
    const promocoes = await promocaoService.buscarVigentesDaUnidade(dados.unidadeId)

    const itensCalculados: ItemDoPedido[] = []
    const errosEstoque: DetalheErro[] = []

    for (let i = 0; i < dados.itens.length; i++) {
      const item = dados.itens[i]
      const produto = await produtoRepositorio.buscarPorId(item.produtoId)

      if (!produto || !produto.ativo) {
        throw new ErroAplicacao(404, 'PRODUTO_NAO_ENCONTRADO', 'Um ou mais produtos não foram encontrados.', [
          { field: `itens[${i}].produtoId`, issue: `Produto ${item.produtoId} não existe.` }
        ])
      }

      const estoque = await estoqueRepositorio.buscar(dados.unidadeId, item.produtoId)
      const disponivel = estoque ? estoque.quantidade : 0

      if (!estoque || !temQuantidadeSuficiente(disponivel, item.quantidade)) {
        errosEstoque.push({ field: `itens[${i}].quantidade`, issue: `Disponível: ${disponivel}` })
        continue
      }

      const precoCentavos = paraCentavos(Number(produto.preco))
      const promocao = escolherMelhorPromocao(promocoes, item.produtoId)
      const descontoCentavos = promocao
        ? calcularDescontoPromocional(precoCentavos, promocao.percentualDesconto) * item.quantidade
        : 0

      itensCalculados.push({
        produtoId: item.produtoId,
        estoqueId: estoque.id,
        quantidade: item.quantidade,
        precoCentavos,
        descontoCentavos,
        promocaoId: promocao ? promocao.id : null
      })
    }

    if (errosEstoque.length > 0) {
      throw new ErroAplicacao(409, 'ESTOQUE_INSUFICIENTE', 'Não há quantidade suficiente para um ou mais itens.', errosEstoque)
    }

    const pontosResgatados = dados.pontosResgatados ?? 0

    if (pontosResgatados > 0) {
      if (!cliente) {
        throw new ErroAplicacao(422, 'CLIENTE_OBRIGATORIO_PARA_RESGATE', 'Para resgatar pontos o pedido precisa estar vinculado a um cliente.', [
          { field: 'clienteId', issue: 'Informe o cliente que vai usar os pontos.' }
        ])
      }

      validarResgateDePontos(cliente.pontosFidelidade, pontosResgatados, cliente.consentimentoFidelidade)
    }

    const valores = calcularValoresDoPedido(itensCalculados, calcularDescontoDosPontos(pontosResgatados))

    const pedido = await executarTransacao(async (tx) => {
      const novoPedido = await pedidoRepositorio.criar(
        {
          clienteId: cliente ? cliente.id : null,
          unidadeId: dados.unidadeId,
          canalPedido: dados.canalPedido,
          formaPagamento: dados.formaPagamento,
          subtotal: paraReais(valores.subtotalCentavos),
          desconto: paraReais(valores.descontoCentavos),
          total: paraReais(valores.totalCentavos),
          pontosUsados: pontosResgatados,
          observacao: dados.observacao,
          criadoPorId: usuario.id,
          itens: itensCalculados.map((item) => ({
            produtoId: item.produtoId,
            promocaoId: item.promocaoId,
            quantidade: item.quantidade,
            precoUnitario: paraReais(item.precoCentavos),
            desconto: paraReais(item.descontoCentavos)
          }))
        },
        tx
      )

      for (const item of itensCalculados) {
        const conseguiuRetirar = await estoqueRepositorio.retirar(item.estoqueId, item.quantidade, tx)

        if (!conseguiuRetirar) {
          throw new ErroAplicacao(409, 'ESTOQUE_INSUFICIENTE', 'O estoque foi alterado durante a criação do pedido. Tente novamente.')
        }

        await estoqueRepositorio.registrarMovimentacao(
          {
            estoqueId: item.estoqueId,
            tipo: 'SAIDA',
            quantidade: item.quantidade,
            motivo: `Pedido #${novoPedido.id}`,
            usuarioId: usuario.id,
            pedidoId: novoPedido.id
          },
          tx
        )
      }

      if (cliente && pontosResgatados > 0) {
        await fidelidadeService.debitarPontosDoPedido(cliente.id, novoPedido.id, pontosResgatados, tx)
      }

      await auditoriaService.registrar(
        {
          usuarioId: usuario.id,
          acao: 'PEDIDO_CRIADO',
          entidade: 'pedido',
          entidadeId: novoPedido.id,
          detalhes: {
            canalPedido: novoPedido.canalPedido,
            unidadeId: novoPedido.unidadeId,
            total: Number(novoPedido.total),
            pontosResgatados
          }
        },
        tx
      )

      return novoPedido
    })

    return formatarPedido(pedido)
  },

  async listar(filtros: FiltrosListagem, pagina: number, limite: number, usuario: UsuarioLogado) {
    const filtrosBusca: FiltrosListagem & { clienteId?: number } = { ...filtros }

    if (usuario.perfil === 'CLIENTE') {
      const cliente = await clienteRepositorio.buscarPorUsuarioId(usuario.id)
      filtrosBusca.clienteId = cliente ? cliente.id : 0
    } else if (usuario.perfil !== 'ADMIN') {
      if (filtros.unidadeId && filtros.unidadeId !== usuario.unidadeId) {
        throw new ErroAplicacao(403, 'ACESSO_NEGADO', 'Você só pode acessar dados da sua unidade.')
      }
      filtrosBusca.unidadeId = usuario.unidadeId ?? 0
    }

    const pedidos = await pedidoRepositorio.listar(filtrosBusca, calcularPulo(pagina, limite), limite)
    const total = await pedidoRepositorio.contar(filtrosBusca)

    return {
      dados: pedidos.map(formatarPedido),
      paginacao: montarPaginacao(pagina, limite, total)
    }
  },

  async buscarPorId(id: number, usuario: UsuarioLogado) {
    const pedido = await buscarPedidoComAcesso(id, usuario)
    return formatarPedido(pedido)
  },

  async atualizarStatus(id: number, novoStatus: StatusPedido, usuario: UsuarioLogado) {
    const pedido = await buscarPedidoComAcesso(id, usuario)

    validarMudancaDeStatus(pedido.status, novoStatus, usuario.perfil)

    const pedidoAtualizado = await executarTransacao(async (tx) => {
      const atualizou = await pedidoRepositorio.atualizarStatus(id, pedido.status, novoStatus, tx)

      if (!atualizou) {
        throw new ErroAplicacao(409, 'PEDIDO_ALTERADO', 'O pedido foi alterado por outra operação. Consulte novamente.')
      }

      await auditoriaService.registrar(
        {
          usuarioId: usuario.id,
          acao: 'STATUS_PEDIDO_ALTERADO',
          entidade: 'pedido',
          entidadeId: id,
          detalhes: { statusAnterior: pedido.status, novoStatus }
        },
        tx
      )

      return pedidoRepositorio.buscarPorId(id, tx)
    })

    return formatarPedido(pedidoAtualizado!)
  },

  async cancelar(id: number, motivo: string | undefined, usuario: UsuarioLogado) {
    const pedido = await buscarPedidoComAcesso(id, usuario)

    if (!podeSerCancelado(pedido.status)) {
      throw new ErroAplicacao(409, 'PEDIDO_NAO_PODE_SER_CANCELADO', `Pedidos com status ${pedido.status} não podem ser cancelados.`)
    }

    const pedidoCancelado = await executarTransacao(async (tx) => {
      const atualizou = await pedidoRepositorio.atualizarStatus(id, pedido.status, 'CANCELADO', tx)

      if (!atualizou) {
        throw new ErroAplicacao(409, 'PEDIDO_ALTERADO', 'O pedido foi alterado por outra operação. Consulte novamente.')
      }

      for (const item of pedido.itens) {
        const estoque = await estoqueRepositorio.adicionar(pedido.unidadeId, item.produtoId, item.quantidade, tx)

        await estoqueRepositorio.registrarMovimentacao(
          {
            estoqueId: estoque.id,
            tipo: 'ENTRADA',
            quantidade: item.quantidade,
            motivo: `Cancelamento do pedido #${id}`,
            usuarioId: usuario.id,
            pedidoId: id
          },
          tx
        )
      }

      let pagamentoEstornado = false
      if (pedido.status === 'RECEBIDO') {
        const resultado = await pagamentoRepositorio.marcarComoEstornado(id, tx)
        pagamentoEstornado = resultado.count > 0
      }

      if (pedido.clienteId) {
        await fidelidadeService.estornarPontosDoPedido(pedido.clienteId, id, tx)
      }

      await auditoriaService.registrar(
        {
          usuarioId: usuario.id,
          acao: 'PEDIDO_CANCELADO',
          entidade: 'pedido',
          entidadeId: id,
          detalhes: { statusAnterior: pedido.status, motivo: motivo ?? null, pagamentoEstornado }
        },
        tx
      )

      return pedidoRepositorio.buscarPorId(id, tx)
    })

    return formatarPedido(pedidoCancelado!)
  }
}
