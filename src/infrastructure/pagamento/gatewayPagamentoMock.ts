import { randomUUID } from 'crypto'
import { SimulacaoPagamento } from '../../domain/enums'

export type RequisicaoGateway = {
  pedidoId: number
  valor: number
  formaPagamento: string
  simulacao: SimulacaoPagamento
}

export type RespostaGateway = {
  codigoTransacao: string
  status: 'APROVADO' | 'RECUSADO'
  mensagem: string
  valor: number
  processadoEm: string
}

export class GatewayIndisponivelErro extends Error {}

function esperar(milissegundos: number) {
  return new Promise((resolve) => setTimeout(resolve, milissegundos))
}

export const gatewayPagamentoMock = {
  async processar(requisicao: RequisicaoGateway): Promise<RespostaGateway> {
    await esperar(200)

    if (requisicao.simulacao === 'FALHAR') {
      throw new GatewayIndisponivelErro('O gateway de pagamento não respondeu dentro do tempo limite.')
    }

    const codigoTransacao = `MOCK-${randomUUID()}`
    const processadoEm = new Date().toISOString()

    if (requisicao.simulacao === 'RECUSAR') {
      return {
        codigoTransacao,
        status: 'RECUSADO',
        mensagem: 'Pagamento recusado pela operadora: saldo ou limite insuficiente.',
        valor: requisicao.valor,
        processadoEm
      }
    }

    return {
      codigoTransacao,
      status: 'APROVADO',
      mensagem: 'Pagamento aprovado.',
      valor: requisicao.valor,
      processadoEm
    }
  }
}
