import { z } from 'zod'

z.setErrorMap((issue, contexto) => {
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    return { message: 'Campo obrigatório.' }
  }

  if (issue.code === 'invalid_type') {
    return { message: `Tipo inválido. Esperado ${issue.expected}, recebido ${issue.received}.` }
  }

  if (issue.code === 'invalid_string' && issue.validation === 'email') {
    return { message: 'E-mail em formato inválido.' }
  }

  if (issue.code === 'invalid_enum_value') {
    return { message: `Valor inválido. Valores aceitos: ${issue.options.join(', ')}.` }
  }

  if (issue.code === 'too_small' && issue.type === 'string') {
    return { message: `Deve ter no mínimo ${issue.minimum} caracteres.` }
  }

  if (issue.code === 'too_small' && issue.type === 'array') {
    return { message: `Deve ter no mínimo ${issue.minimum} item(ns).` }
  }

  if (issue.code === 'too_small') {
    return { message: `Deve ser maior ou igual a ${issue.minimum}.` }
  }

  if (issue.code === 'too_big' && issue.type === 'string') {
    return { message: `Deve ter no máximo ${issue.maximum} caracteres.` }
  }

  if (issue.code === 'too_big') {
    return { message: `Deve ser menor ou igual a ${issue.maximum}.` }
  }

  return { message: contexto.defaultError }
})
