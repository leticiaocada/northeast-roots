import { ErroAplicacao } from '../src/domain/ErroAplicacao'
import { calcularValoresDoPedido, podeReceberPagamento, podeSerCancelado, validarMudancaDeStatus } from '../src/domain/pedido'

describe('Regras de status do pedido', () => {
  test('cozinha pode mudar de RECEBIDO para EM_PREPARO', () => {
    expect(() => validarMudancaDeStatus('RECEBIDO', 'EM_PREPARO', 'COZINHA')).not.toThrow()
  })

  test('atendente pode marcar pedido PRONTO como ENTREGUE', () => {
    expect(() => validarMudancaDeStatus('PRONTO', 'ENTREGUE', 'ATENDENTE')).not.toThrow()
  })

  test('não permite pular etapas do preparo', () => {
    try {
      validarMudancaDeStatus('RECEBIDO', 'ENTREGUE', 'GERENTE')
      fail('deveria ter lançado erro')
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroAplicacao)
      expect((erro as ErroAplicacao).status).toBe(409)
    }
  })

  test('não permite colocar em preparo um pedido aguardando pagamento', () => {
    expect(() => validarMudancaDeStatus('AGUARDANDO_PAGAMENTO', 'EM_PREPARO', 'COZINHA')).toThrow(ErroAplicacao)
  })

  test('atendente não pode colocar pedido em preparo', () => {
    try {
      validarMudancaDeStatus('RECEBIDO', 'EM_PREPARO', 'ATENDENTE')
      fail('deveria ter lançado erro')
    } catch (erro) {
      expect((erro as ErroAplicacao).status).toBe(403)
    }
  })

  test('status RECEBIDO não pode ser definido manualmente', () => {
    try {
      validarMudancaDeStatus('AGUARDANDO_PAGAMENTO', 'RECEBIDO', 'ADMIN')
      fail('deveria ter lançado erro')
    } catch (erro) {
      expect((erro as ErroAplicacao).status).toBe(422)
    }
  })

  test('só permite cancelar antes do preparo', () => {
    expect(podeSerCancelado('AGUARDANDO_PAGAMENTO')).toBe(true)
    expect(podeSerCancelado('RECEBIDO')).toBe(true)
    expect(podeSerCancelado('EM_PREPARO')).toBe(false)
    expect(podeSerCancelado('ENTREGUE')).toBe(false)
  })

  test('só aceita pagamento quando o pedido está aguardando pagamento', () => {
    expect(podeReceberPagamento('AGUARDANDO_PAGAMENTO')).toBe(true)
    expect(podeReceberPagamento('RECEBIDO')).toBe(false)
    expect(podeReceberPagamento('CANCELADO')).toBe(false)
  })
})

describe('Cálculo dos valores do pedido', () => {
  test('calcula subtotal e total sem descontos', () => {
    const valores = calcularValoresDoPedido(
      [
        { precoCentavos: 3990, quantidade: 2, descontoCentavos: 0 },
        { precoCentavos: 4990, quantidade: 1, descontoCentavos: 0 }
      ],
      0
    )

    expect(valores.subtotalCentavos).toBe(12970)
    expect(valores.totalCentavos).toBe(12970)
  })

  test('aplica desconto de promoção e de pontos', () => {
    const valores = calcularValoresDoPedido([{ precoCentavos: 750, quantidade: 2, descontoCentavos: 300 }], 500)

    expect(valores.subtotalCentavos).toBe(1500)
    expect(valores.descontoCentavos).toBe(800)
    expect(valores.totalCentavos).toBe(700)
  })

  test('não deixa o desconto passar do valor do pedido', () => {
    expect(() => calcularValoresDoPedido([{ precoCentavos: 1000, quantidade: 1, descontoCentavos: 0 }], 2000)).toThrow(
      ErroAplicacao
    )
  })
})
