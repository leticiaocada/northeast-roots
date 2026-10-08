export function calcularPulo(pagina: number, limite: number) {
  return (pagina - 1) * limite
}

export function montarPaginacao(pagina: number, limite: number, total: number) {
  return {
    pagina,
    limite,
    total,
    totalPaginas: Math.ceil(total / limite)
  }
}
