# DER - Modelo de Dados

Banco relacional PostgreSQL. As tabelas são criadas pela migration do Prisma em `prisma/migrations` e o modelo está em `prisma/schema.prisma`.

```mermaid
erDiagram
    usuarios ||--o| clientes : "possui (0..1)"
    unidades ||--o{ usuarios : "lota funcionários"
    unidades ||--o{ estoques : "possui estoque próprio"
    produtos ||--o{ estoques : "estocado em"
    estoques ||--o{ movimentacoes_estoque : "registra"
    usuarios ||--o{ movimentacoes_estoque : "executa"
    clientes ||--o{ pedidos : "faz"
    unidades ||--o{ pedidos : "recebe"
    usuarios ||--o{ pedidos : "registra (criado_por)"
    pedidos ||--|{ itens_pedido : "contém"
    produtos ||--o{ itens_pedido : "vendido em"
    promocoes ||--o{ itens_pedido : "aplicada em"
    pedidos ||--o{ pagamentos : "tentativas"
    pedidos ||--o{ movimentacoes_estoque : "gera"
    clientes ||--o{ movimentacoes_fidelidade : "acumula/resgata"
    pedidos ||--o{ movimentacoes_fidelidade : "origina"
    produtos ||--o{ promocoes : "em promoção"
    unidades ||--o{ promocoes : "restrita à unidade"
    usuarios ||--o{ logs_auditoria : "autor da ação"

    usuarios {
        int id PK
        string nome
        string email UK
        string senha_hash
        enum perfil "CLIENTE, ATENDENTE, COZINHA, GERENTE, ADMIN"
        int unidade_id FK "nulo para CLIENTE e ADMIN"
        boolean ativo
        datetime anonimizado_em
        datetime criado_em
    }
    clientes {
        int id PK
        int usuario_id FK,UK
        string telefone
        int pontos_fidelidade
        boolean consentimento_fidelidade
        datetime data_consentimento
    }
    unidades {
        int id PK
        string nome
        string cep
        string cidade
        char estado
        boolean ativa
    }
    produtos {
        int id PK
        string nome
        string descricao
        decimal preco
        string categoria
        boolean ativo
    }
    estoques {
        int id PK
        int unidade_id FK
        int produto_id FK
        int quantidade
    }
    movimentacoes_estoque {
        int id PK
        int estoque_id FK
        enum tipo "ENTRADA, SAIDA"
        int quantidade
        string motivo
        int usuario_id FK
        int pedido_id FK
    }
    pedidos {
        int id PK
        int cliente_id FK "nulo em pedido de balcão sem cadastro"
        int unidade_id FK
        enum canal_pedido "APP, TOTEM, BALCAO, PICKUP, WEB"
        enum status "AGUARDANDO_PAGAMENTO, RECEBIDO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO"
        enum forma_pagamento
        decimal subtotal
        decimal desconto
        decimal total
        int pontos_usados
        int criado_por_id FK
        datetime criado_em
    }
    itens_pedido {
        int id PK
        int pedido_id FK
        int produto_id FK
        int promocao_id FK
        int quantidade
        decimal preco_unitario
        decimal desconto
    }
    pagamentos {
        int id PK
        int pedido_id FK
        decimal valor
        enum forma_pagamento
        enum status "APROVADO, RECUSADO, FALHA, ESTORNADO"
        string codigo_transacao
        string mensagem
        json resposta_gateway
    }
    movimentacoes_fidelidade {
        int id PK
        int cliente_id FK
        int pedido_id FK
        enum tipo "CREDITO, DEBITO"
        int pontos
        string descricao
    }
    promocoes {
        int id PK
        string nome
        int produto_id FK
        int unidade_id FK "nulo = rede toda"
        int percentual_desconto
        datetime data_inicio
        datetime data_fim
        boolean ativa
    }
    logs_auditoria {
        int id PK
        int usuario_id FK
        string acao
        string entidade
        int entidade_id
        json detalhes
        datetime criado_em
    }
```

## Principais restrições

| Restrição | Onde | Motivo |
|---|---|---|
| `usuarios.email` único | usuarios | Login por e-mail |
| `clientes.usuario_id` único | clientes | Relação 1:1 entre usuário e cliente |
| `(unidade_id, produto_id)` único | estoques | Cada unidade possui um único saldo por produto (estoque próprio) |
| `canal_pedido` obrigatório (ENUM) | pedidos | Multicanalidade e rastreabilidade por canal |
| Índices em `canal_pedido`, `status` e `unidade_id` | pedidos | Consultas e filtros mais rápidos em horário de pico |
| Pagamento em tabela separada | pagamentos | Pagamento desacoplado do pedido: um pedido pode ter várias tentativas (recusado, falha, aprovado) |
| Valores monetários `DECIMAL(10,2)` | pedidos, itens, produtos, pagamentos | Evitar erro de arredondamento de ponto flutuante |
| Exclusão lógica (`ativa`/`ativo`) | unidades, produtos, promoções | Preserva o histórico dos pedidos já realizados |

## Diferenças em relação ao DER inicial

O DER inicial (entregue na primeira parte do trabalho) foi evoluído durante a implementação:

- Nomes de tabelas e colunas traduzidos para o português, iguais aos do banco.
- A tabela `menus` foi substituída por `estoques`: o cardápio da unidade passa a ser formado pelos produtos que possuem estoque naquela unidade. Assim o produto é cadastrado uma vez só e cada unidade controla o próprio saldo.
- Foram adicionadas as tabelas `movimentacoes_estoque`, `pagamentos`, `movimentacoes_fidelidade`, `promocoes` e `logs_auditoria`, necessárias para o controle de estoque, o pagamento mock, a fidelidade, as promoções e a auditoria.
