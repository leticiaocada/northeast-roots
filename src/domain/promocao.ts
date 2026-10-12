export type PromocaoAplicavel = {
  id: number
  nome: string
  produtoId: number
  percentualDesconto: number
}

export function escolherMelhorPromocao(promocoes: PromocaoAplicavel[], produtoId: number) {
  const promocoesDoProduto = promocoes.filter((promocao) => promocao.produtoId === produtoId)

  if (promocoesDoProduto.length === 0) {
    return null
  }

  return promocoesDoProduto.reduce((melhor, atual) =>
    atual.percentualDesconto > melhor.percentualDesconto ? atual : melhor
  )
}

export function calcularDescontoPromocional(precoCentavos: number, percentualDesconto: number) {
  return Math.round((precoCentavos * percentualDesconto) / 100)
}
