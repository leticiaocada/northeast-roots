export function temQuantidadeSuficiente(quantidadeDisponivel: number, quantidadeSolicitada: number) {
  return quantidadeDisponivel >= quantidadeSolicitada
}

export function estaDisponivel(quantidadeDisponivel: number) {
  return quantidadeDisponivel > 0
}
