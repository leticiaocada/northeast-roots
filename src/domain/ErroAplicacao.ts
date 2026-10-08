export type DetalheErro = {
  field: string
  issue: string
}

export class ErroAplicacao extends Error {
  status: number
  codigo: string
  detalhes: DetalheErro[]

  constructor(status: number, codigo: string, mensagem: string, detalhes: DetalheErro[] = []) {
    super(mensagem)
    this.status = status
    this.codigo = codigo
    this.detalhes = detalhes
  }
}
