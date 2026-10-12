function escrever(nivel: string, mensagem: string, dados?: object) {
  console.log(JSON.stringify({ nivel, mensagem, ...dados, data: new Date().toISOString() }))
}

export const logger = {
  info: (mensagem: string, dados?: object) => escrever('info', mensagem, dados),
  erro: (mensagem: string, dados?: object) => escrever('erro', mensagem, dados)
}
