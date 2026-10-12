export function paraCentavos(valor: number) {
  return Math.round(valor * 100)
}

export function paraReais(centavos: number) {
  return centavos / 100
}
