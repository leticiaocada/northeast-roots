# Diagrama de Classes (domínio)

```mermaid
classDiagram
    direction LR

    class Usuario {
        +int id
        +string nome
        +string email
        +string senhaHash
        +Perfil perfil
        +boolean ativo
        +Date anonimizadoEm
    }
    class Cliente {
        +int id
        +string telefone
        +int pontosFidelidade
        +boolean consentimentoFidelidade
        +Date dataConsentimento
    }
    class Unidade {
        +int id
        +string nome
        +string cep
        +string cidade
        +string estado
        +boolean ativa
    }
    class Produto {
        +int id
        +string nome
        +decimal preco
        +string categoria
        +boolean ativo
    }
    class Estoque {
        +int id
        +int quantidade
        +temQuantidadeSuficiente(solicitado) boolean
        +estaDisponivel() boolean
    }
    class MovimentacaoEstoque {
        +int id
        +TipoMovimentacao tipo
        +int quantidade
        +string motivo
    }
    class Pedido {
        +int id
        +CanalPedido canalPedido
        +StatusPedido status
        +FormaPagamento formaPagamento
        +decimal subtotal
        +decimal desconto
        +decimal total
        +int pontosUsados
        +validarMudancaDeStatus(novo, perfil)
        +podeSerCancelado() boolean
        +podeReceberPagamento() boolean
        +calcularValores(itens, descontoPontos)
    }
    class ItemPedido {
        +int quantidade
        +decimal precoUnitario
        +decimal desconto
    }
    class Pagamento {
        +int id
        +decimal valor
        +StatusPagamento status
        +string codigoTransacao
        +string mensagem
        +json respostaGateway
    }
    class Promocao {
        +int id
        +string nome
        +int percentualDesconto
        +Date dataInicio
        +Date dataFim
        +calcularDesconto(preco) int
    }
    class MovimentacaoFidelidade {
        +int id
        +TipoFidelidade tipo
        +int pontos
        +string descricao
    }
    class LogAuditoria {
        +int id
        +string acao
        +string entidade
        +int entidadeId
        +json detalhes
    }
    class GatewayPagamentoMock {
        +processar(requisicao) RespostaGateway
    }

    class Perfil {
        <<enumeration>>
        CLIENTE
        ATENDENTE
        COZINHA
        GERENTE
        ADMIN
    }
    class CanalPedido {
        <<enumeration>>
        APP
        TOTEM
        BALCAO
        PICKUP
        WEB
    }
    class StatusPedido {
        <<enumeration>>
        AGUARDANDO_PAGAMENTO
        RECEBIDO
        EM_PREPARO
        PRONTO
        ENTREGUE
        CANCELADO
    }

    Usuario "1" -- "0..1" Cliente
    Usuario "*" --> "0..1" Unidade : trabalha em
    Unidade "1" *-- "*" Estoque
    Produto "1" -- "*" Estoque
    Estoque "1" *-- "*" MovimentacaoEstoque
    Cliente "0..1" -- "*" Pedido
    Unidade "1" -- "*" Pedido
    Pedido "1" *-- "1..*" ItemPedido
    ItemPedido "*" --> "1" Produto
    ItemPedido "*" --> "0..1" Promocao
    Pedido "1" -- "*" Pagamento
    Cliente "1" *-- "*" MovimentacaoFidelidade
    Promocao "*" --> "1" Produto
    Promocao "*" --> "0..1" Unidade
    Usuario "1" -- "*" LogAuditoria
    Pagamento ..> GatewayPagamentoMock : resposta de
    Pedido --> CanalPedido
    Pedido --> StatusPedido
    Usuario --> Perfil
```

As regras de domínio ficam em funções puras na pasta `src/domain`:

| Arquivo | Regras |
|---|---|
| `pedido.ts` | Transições de status permitidas, perfis que podem definir cada status, cancelamento, pagamento e cálculo de subtotal/desconto/total |
| `estoque.ts` | Quantidade suficiente e disponibilidade no cardápio |
| `fidelidade.ts` | Pontos ganhos (1 por real), valor do ponto (R$ 0,10) e validação de resgate com consentimento |
| `promocao.ts` | Escolha da melhor promoção e cálculo do desconto |
| `usuario.ts` | Máscara de e-mail para logs e dados de anonimização |
| `dinheiro.ts` | Conversão entre reais e centavos para evitar erros de arredondamento |
