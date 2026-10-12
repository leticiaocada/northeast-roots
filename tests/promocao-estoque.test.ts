import { estaDisponivel, temQuantidadeSuficiente } from '../src/domain/estoque'
import { calcularDescontoPromocional, escolherMelhorPromocao } from '../src/domain/promocao'
import { mascararEmail } from '../src/domain/usuario'

describe('Promoções', () => {
  const promocoes = [
    { id: 1, nome: 'Rede toda', produtoId: 8, percentualDesconto: 10 },
    { id: 2, nome: 'Só Recife', produtoId: 8, percentualDesconto: 20 },
    { id: 3, nome: 'Outro produto', produtoId: 1, percentualDesconto: 50 }
  ]

  test('escolhe a promoção com maior desconto para o produto', () => {
    expect(escolherMelhorPromocao(promocoes, 8)?.id).toBe(2)
  })

  test('retorna null quando o produto não tem promoção', () => {
    expect(escolherMelhorPromocao(promocoes, 99)).toBeNull()
  })

  test('calcula o desconto em centavos', () => {
    expect(calcularDescontoPromocional(750, 20)).toBe(150)
    expect(calcularDescontoPromocional(990, 10)).toBe(99)
  })
})

describe('Estoque', () => {
  test('verifica se a quantidade é suficiente', () => {
    expect(temQuantidadeSuficiente(3, 3)).toBe(true)
    expect(temQuantidadeSuficiente(3, 4)).toBe(false)
  })

  test('produto sem saldo fica indisponível no cardápio', () => {
    expect(estaDisponivel(0)).toBe(false)
    expect(estaDisponivel(1)).toBe(true)
  })
})

describe('LGPD', () => {
  test('mascara o e-mail para registrar em log', () => {
    expect(mascararEmail('maria@cliente.com.br')).toBe('ma***@cliente.com.br')
  })
})
