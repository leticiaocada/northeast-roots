import { ErroAplicacao } from '../src/domain/ErroAplicacao'
import { calcularDescontoDosPontos, calcularPontosGanhos, validarResgateDePontos } from '../src/domain/fidelidade'

describe('Programa de fidelidade', () => {
  test('ganha 1 ponto para cada real inteiro gasto', () => {
    expect(calcularPontosGanhos(12970)).toBe(129)
    expect(calcularPontosGanhos(99)).toBe(0)
  })

  test('cada 10 pontos valem R$ 1,00 de desconto', () => {
    expect(calcularDescontoDosPontos(100)).toBe(1000)
  })

  test('permite resgate com consentimento e saldo suficiente', () => {
    expect(() => validarResgateDePontos(150, 100, true)).not.toThrow()
  })

  test('bloqueia resgate sem consentimento', () => {
    try {
      validarResgateDePontos(150, 100, false)
      fail('deveria ter lançado erro')
    } catch (erro) {
      expect((erro as ErroAplicacao).codigo).toBe('CONSENTIMENTO_NECESSARIO')
    }
  })

  test('bloqueia resgate maior que o saldo', () => {
    try {
      validarResgateDePontos(50, 100, true)
      fail('deveria ter lançado erro')
    } catch (erro) {
      expect((erro as ErroAplicacao).codigo).toBe('PONTOS_INSUFICIENTES')
    }
  })
})
