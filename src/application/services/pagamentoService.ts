import { Pagamento } from '@prisma/client'
import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { paraCentavos } from '../../domain/dinheiro'
import { SimulacaoPagamento } from '../../domain/enums'
import { podeReceberPagamento } from '../../domain/pedido'
import { UsuarioLogado } from '../../domain/usuario'
import { executarTransacao } from '../../infrastructure/banco/prisma'
import { logger } from '../../infrastructure/logger'
import { gatewayPagamentoMock, RespostaGateway } from '../../infrastructure/pagamento/gatewayPagamentoMock'
import { pagamentoRepositorio } from '../../infrastructure/repositorios/pagamentoRepositorio'
import { pedidoRepositorio } from '../../infrastructure/repositorios/pedidoRepositorio'
import { auditoriaService } from './auditoriaService'
import { fidelidadeService } from './fidelidadeService'
import { pedidoService } from './pedidoService'

function formatarPagamento(pagamento: Pagamento) {
  return {
    id: pagamento.id,
    pedidoId: pagamento.pedidoId,
    valor: Number(pagamento.valor),
    formaPagamento: pagamento.formaPagamento,
    status: pagamento.status,
    codigoTransacao: pagamento.codigoTransacao,
    mensagem: pagamento.mensagem,
    criadoEm: pagamento.criadoEm
  }
}

export const pagamentoService = {
  async solicitar(pedidoId: number, simulacao: SimulacaoPagamento, usuario: UsuarioLogado) {
    const pedido = await pedidoService.buscarPedidoComAcesso(pedidoId, usuario)

    if (pedido.status === 'CANCELADO') {
      throw new ErroAplicacao(409, 'PEDIDO_CANCELADO', 'Não é possível pagar um pedido cancelado.')
    }

    if (!podeReceberPagamento(pedido.status)) {
      throw new ErroAplicacao(409, 'PEDIDO_JA_PAGO', 'Este pedido já possui pagamento aprovado.')
    }

    const valor = Number(pedido.total)
    let resposta: RespostaGateway

    try {
      resposta = await gatewayPagamentoMock.processar({
        pedidoId,
        valor,
        formaPagamento: pedido.formaPagamento,
        simulacao
      })
    } catch (erro) {
      logger.erro('falha na comunicação com o gateway de pagamento', { pedidoId })

      await pagamentoRepositorio.criar({
        pedidoId,
        valor,
        formaPagamento: pedido.formaPagamento,
        status: 'FALHA',
        mensagem: 'Gateway de pagamento indisponível.'
      })

      await auditoriaService.registrar({
        usuarioId: usuario.id,
        acao: 'PAGAMENTO_FALHOU',
        entidade: 'pedido',
        entidadeId: pedidoId
      })

      throw new ErroAplicacao(
        503,
        'GATEWAY_PAGAMENTO_INDISPONIVEL',
        'O serviço de pagamento está indisponível no momento. O pedido continua aguardando pagamento, tente novamente.'
      )
    }

    if (resposta.status === 'RECUSADO') {
      const pagamentoRecusado = await pagamentoRepositorio.criar({
        pedidoId,
        valor,
        formaPagamento: pedido.formaPagamento,
        status: 'RECUSADO',
        codigoTransacao: resposta.codigoTransacao,
        mensagem: resposta.mensagem,
        respostaGateway: resposta
      })

      await auditoriaService.registrar({
        usuarioId: usuario.id,
        acao: 'PAGAMENTO_RECUSADO',
        entidade: 'pedido',
        entidadeId: pedidoId,
        detalhes: { pagamentoId: pagamentoRecusado.id, codigoTransacao: resposta.codigoTransacao }
      })

      throw new ErroAplicacao(402, 'PAGAMENTO_RECUSADO', resposta.mensagem, [
        { field: 'pagamentoId', issue: `Pagamento ${pagamentoRecusado.id} registrado como RECUSADO.` },
        { field: 'pedido.status', issue: 'O pedido continua AGUARDANDO_PAGAMENTO e pode receber nova tentativa.' }
      ])
    }

    const resultado = await executarTransacao(async (tx) => {
      const atualizou = await pedidoRepositorio.atualizarStatus(pedidoId, 'AGUARDANDO_PAGAMENTO', 'RECEBIDO', tx)

      if (!atualizou) {
        throw new ErroAplicacao(409, 'PEDIDO_JA_PAGO', 'Este pedido já possui pagamento aprovado.')
      }

      const pagamentoAprovado = await pagamentoRepositorio.criar(
        {
          pedidoId,
          valor,
          formaPagamento: pedido.formaPagamento,
          status: 'APROVADO',
          codigoTransacao: resposta.codigoTransacao,
          mensagem: resposta.mensagem,
          respostaGateway: resposta
        },
        tx
      )

      let pontosGanhos = 0
      if (pedido.clienteId) {
        pontosGanhos = await fidelidadeService.creditarPontosDoPedido(pedido.clienteId, pedidoId, paraCentavos(valor), tx)
      }

      await auditoriaService.registrar(
        {
          usuarioId: usuario.id,
          acao: 'PAGAMENTO_APROVADO',
          entidade: 'pedido',
          entidadeId: pedidoId,
          detalhes: { pagamentoId: pagamentoAprovado.id, valor, pontosGanhos }
        },
        tx
      )

      await auditoriaService.registrar(
        {
          usuarioId: usuario.id,
          acao: 'STATUS_PEDIDO_ALTERADO',
          entidade: 'pedido',
          entidadeId: pedidoId,
          detalhes: { statusAnterior: 'AGUARDANDO_PAGAMENTO', novoStatus: 'RECEBIDO' }
        },
        tx
      )

      return { pagamentoAprovado, pontosGanhos }
    })

    return {
      pagamento: formatarPagamento(resultado.pagamentoAprovado),
      pedido: { id: pedidoId, status: 'RECEBIDO' },
      pontosGanhos: resultado.pontosGanhos,
      respostaGateway: resposta
    }
  },

  async listarPorPedido(pedidoId: number, usuario: UsuarioLogado) {
    await pedidoService.buscarPedidoComAcesso(pedidoId, usuario)
    const pagamentos = await pagamentoRepositorio.listarPorPedido(pedidoId)
    return pagamentos.map(formatarPagamento)
  }
}
