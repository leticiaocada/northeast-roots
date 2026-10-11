import { ErroAplicacao } from '../../domain/ErroAplicacao'
import { paraReais } from '../../domain/dinheiro'
import { calcularDescontoDosPontos, calcularPontosGanhos, CENTAVOS_POR_PONTO, PONTOS_POR_REAL } from '../../domain/fidelidade'
import { UsuarioLogado } from '../../domain/usuario'
import { Transacao } from '../../infrastructure/banco/prisma'
import { clienteRepositorio } from '../../infrastructure/repositorios/clienteRepositorio'
import { fidelidadeRepositorio } from '../../infrastructure/repositorios/fidelidadeRepositorio'
import { calcularPulo, montarPaginacao } from '../paginacao'
import { auditoriaService } from './auditoriaService'

async function buscarClienteLogado(usuario: UsuarioLogado) {
  const cliente = await clienteRepositorio.buscarPorUsuarioId(usuario.id)

  if (!cliente) {
    throw new ErroAplicacao(404, 'CLIENTE_NAO_ENCONTRADO', 'Cadastro de cliente não encontrado para este usuário.')
  }

  return cliente
}

export const fidelidadeService = {
  async consultarSaldo(usuario: UsuarioLogado) {
    const cliente = await buscarClienteLogado(usuario)

    return {
      clienteId: cliente.id,
      pontos: cliente.pontosFidelidade,
      valorEmReais: paraReais(calcularDescontoDosPontos(cliente.pontosFidelidade)),
      consentimentoFidelidade: cliente.consentimentoFidelidade,
      dataConsentimento: cliente.dataConsentimento,
      regras: {
        pontosPorRealGasto: PONTOS_POR_REAL,
        valorDeCadaPonto: paraReais(CENTAVOS_POR_PONTO)
      }
    }
  },

  async listarHistorico(usuario: UsuarioLogado, pagina: number, limite: number) {
    const cliente = await buscarClienteLogado(usuario)
    const movimentacoes = await fidelidadeRepositorio.listarPorCliente(cliente.id, calcularPulo(pagina, limite), limite)
    const total = await fidelidadeRepositorio.contarPorCliente(cliente.id)

    return {
      dados: movimentacoes,
      paginacao: montarPaginacao(pagina, limite, total)
    }
  },

  async atualizarConsentimento(usuario: UsuarioLogado, consentimento: boolean) {
    const cliente = await buscarClienteLogado(usuario)
    await clienteRepositorio.atualizarConsentimento(cliente.id, consentimento)

    await auditoriaService.registrar({
      usuarioId: usuario.id,
      acao: 'CONSENTIMENTO_FIDELIDADE_ALTERADO',
      entidade: 'cliente',
      entidadeId: cliente.id,
      detalhes: { consentimento }
    })

    return this.consultarSaldo(usuario)
  },

  async creditarPontosDoPedido(clienteId: number, pedidoId: number, totalCentavos: number, tx: Transacao) {
    const cliente = await clienteRepositorio.buscarPorId(clienteId, tx)

    if (!cliente || !cliente.consentimentoFidelidade) {
      return 0
    }

    const pontos = calcularPontosGanhos(totalCentavos)

    if (pontos <= 0) {
      return 0
    }

    await clienteRepositorio.creditarPontos(clienteId, pontos, tx)
    await fidelidadeRepositorio.registrar(
      { clienteId, pedidoId, tipo: 'CREDITO', pontos, descricao: `Pontos ganhos no pedido #${pedidoId}` },
      tx
    )

    return pontos
  },

  async debitarPontosDoPedido(clienteId: number, pedidoId: number, pontos: number, tx: Transacao) {
    const conseguiuDebitar = await clienteRepositorio.debitarPontos(clienteId, pontos, tx)

    if (!conseguiuDebitar) {
      throw new ErroAplicacao(409, 'PONTOS_INSUFICIENTES', 'O cliente não possui pontos suficientes.')
    }

    await fidelidadeRepositorio.registrar(
      { clienteId, pedidoId, tipo: 'DEBITO', pontos, descricao: `Resgate de pontos no pedido #${pedidoId}` },
      tx
    )
  },

  async estornarPontosDoPedido(clienteId: number, pedidoId: number, tx: Transacao) {
    const movimentacoes = await fidelidadeRepositorio.listarPorPedido(pedidoId, tx)

    for (const movimentacao of movimentacoes) {
      if (movimentacao.tipo === 'DEBITO') {
        await clienteRepositorio.creditarPontos(clienteId, movimentacao.pontos, tx)
        await fidelidadeRepositorio.registrar(
          {
            clienteId,
            pedidoId,
            tipo: 'CREDITO',
            pontos: movimentacao.pontos,
            descricao: `Devolução de pontos do pedido cancelado #${pedidoId}`
          },
          tx
        )
      }

      if (movimentacao.tipo === 'CREDITO') {
        const cliente = await clienteRepositorio.buscarPorId(clienteId, tx)
        const pontosParaRetirar = Math.min(movimentacao.pontos, cliente ? cliente.pontosFidelidade : 0)

        if (pontosParaRetirar > 0) {
          await clienteRepositorio.debitarPontos(clienteId, pontosParaRetirar, tx)
          await fidelidadeRepositorio.registrar(
            {
              clienteId,
              pedidoId,
              tipo: 'DEBITO',
              pontos: pontosParaRetirar,
              descricao: `Estorno dos pontos ganhos no pedido cancelado #${pedidoId}`
            },
            tx
          )
        }
      }
    }
  }
}
