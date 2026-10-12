import { ErroAplicacao } from './ErroAplicacao'

export const PONTOS_POR_REAL = 1
export const CENTAVOS_POR_PONTO = 10

export function calcularPontosGanhos(totalCentavos: number) {
  return Math.floor(totalCentavos / 100) * PONTOS_POR_REAL
}

export function calcularDescontoDosPontos(pontos: number) {
  return pontos * CENTAVOS_POR_PONTO
}

export function validarResgateDePontos(saldo: number, pontosParaResgatar: number, temConsentimento: boolean) {
  if (!temConsentimento) {
    throw new ErroAplicacao(409, 'CONSENTIMENTO_NECESSARIO', 'Para usar pontos é necessário aceitar o programa de fidelidade.', [
      { field: 'pontosResgatados', issue: 'Cliente sem consentimento ativo no programa de fidelidade.' }
    ])
  }

  if (pontosParaResgatar > saldo) {
    throw new ErroAplicacao(409, 'PONTOS_INSUFICIENTES', 'O cliente não possui pontos suficientes.', [
      { field: 'pontosResgatados', issue: `Saldo disponível: ${saldo}` }
    ])
  }
}
