import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SENHA_PADRAO = 'Senha@123'

async function main() {
  const seedAplicado = await prisma.usuario.findUnique({ where: { email: 'admin@raizesdonordeste.com.br' } })

  if (seedAplicado) {
    console.log('Seed já aplicado anteriormente, nada a fazer.')
    return
  }

  const recife = await prisma.unidade.create({
    data: { nome: 'Raízes do Nordeste - Recife Boa Viagem', cep: '51020-000', cidade: 'Recife', estado: 'PE' }
  })
  const fortaleza = await prisma.unidade.create({
    data: { nome: 'Raízes do Nordeste - Fortaleza Aldeota', cep: '60150-160', cidade: 'Fortaleza', estado: 'CE' }
  })
  const salvador = await prisma.unidade.create({
    data: { nome: 'Raízes do Nordeste - Salvador Pelourinho', cep: '40026-280', cidade: 'Salvador', estado: 'BA' }
  })

  const listaProdutos = [
    { nome: 'Baião de Dois', descricao: 'Arroz, feijão verde, queijo coalho e carne de sol', preco: 39.9, categoria: 'PRATO_PRINCIPAL' },
    { nome: 'Carne de Sol com Macaxeira', descricao: 'Carne de sol na manteiga de garrafa com macaxeira frita', preco: 49.9, categoria: 'PRATO_PRINCIPAL' },
    { nome: 'Tapioca de Queijo Coalho', descricao: 'Tapioca recheada com queijo coalho', preco: 18.5, categoria: 'LANCHE' },
    { nome: 'Acarajé', descricao: 'Acarajé com vatapá, caruru e camarão seco', preco: 22, categoria: 'LANCHE' },
    { nome: 'Cuscuz Nordestino', descricao: 'Cuscuz de milho com ovo e manteiga', preco: 15.9, categoria: 'LANCHE' },
    { nome: 'Moqueca de Peixe', descricao: 'Moqueca baiana com arroz e pirão', preco: 69.9, categoria: 'PRATO_PRINCIPAL' },
    { nome: 'Suco de Cajá', descricao: 'Suco natural de cajá 500ml', preco: 9.9, categoria: 'BEBIDA' },
    { nome: 'Cocada', descricao: 'Cocada cremosa de forno', preco: 7.5, categoria: 'SOBREMESA' }
  ]

  const produtos = []
  for (const produto of listaProdutos) {
    produtos.push(await prisma.produto.create({ data: produto }))
  }

  for (const produto of produtos) {
    const quantidadeRecife = produto.nome === 'Moqueca de Peixe' ? 3 : 50
    await prisma.estoque.create({ data: { unidadeId: recife.id, produtoId: produto.id, quantidade: quantidadeRecife } })

    if (produto.nome !== 'Acarajé') {
      await prisma.estoque.create({ data: { unidadeId: fortaleza.id, produtoId: produto.id, quantidade: 30 } })
    }

    await prisma.estoque.create({ data: { unidadeId: salvador.id, produtoId: produto.id, quantidade: 40 } })
  }

  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10)

  await prisma.usuario.create({
    data: { nome: 'Administrador da Matriz', email: 'admin@raizesdonordeste.com.br', senhaHash, perfil: 'ADMIN' }
  })
  await prisma.usuario.create({
    data: { nome: 'Gerente Recife', email: 'gerente.recife@raizesdonordeste.com.br', senhaHash, perfil: 'GERENTE', unidadeId: recife.id }
  })
  await prisma.usuario.create({
    data: { nome: 'Atendente Recife', email: 'atendente.recife@raizesdonordeste.com.br', senhaHash, perfil: 'ATENDENTE', unidadeId: recife.id }
  })
  await prisma.usuario.create({
    data: { nome: 'Cozinha Recife', email: 'cozinha.recife@raizesdonordeste.com.br', senhaHash, perfil: 'COZINHA', unidadeId: recife.id }
  })
  await prisma.usuario.create({
    data: { nome: 'Gerente Fortaleza', email: 'gerente.fortaleza@raizesdonordeste.com.br', senhaHash, perfil: 'GERENTE', unidadeId: fortaleza.id }
  })

  await prisma.usuario.create({
    data: {
      nome: 'Maria Cliente',
      email: 'maria@cliente.com.br',
      senhaHash,
      perfil: 'CLIENTE',
      cliente: {
        create: { telefone: '81999990000', pontosFidelidade: 150, consentimentoFidelidade: true, dataConsentimento: new Date() }
      }
    }
  })
  await prisma.usuario.create({
    data: {
      nome: 'João Cliente',
      email: 'joao@cliente.com.br',
      senhaHash,
      perfil: 'CLIENTE',
      cliente: { create: { consentimentoFidelidade: false } }
    }
  })

  console.log('Seed aplicado com sucesso.')
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
