import { z } from 'zod'
import { PERFIS_FUNCIONARIO } from '../../domain/enums'

const nome = z.string().trim().min(3).max(100)
const email = z.string().trim().toLowerCase().email()
const senha = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra.')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')

export const loginSchema = z.object({
  email,
  senha: z.string().min(1)
})

export const cadastroClienteSchema = z.object({
  nome,
  email,
  senha,
  telefone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, 'Telefone deve ter DDD + número, somente dígitos.')
    .optional(),
  consentimentoFidelidade: z.boolean().default(false)
})

export const cadastroFuncionarioSchema = z
  .object({
    nome,
    email,
    senha,
    perfil: z.enum(PERFIS_FUNCIONARIO),
    unidadeId: z.number().int().min(1).optional()
  })
  .refine((dados) => dados.perfil === 'ADMIN' || dados.unidadeId, {
    message: 'unidadeId é obrigatório para funcionários de unidade.',
    path: ['unidadeId']
  })
