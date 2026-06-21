# Autômato Finito

Projeto acadêmico que implementa um **Autômato Finito Determinístico (AFD)** e um **Autômato com Pilha Não-Determinístico (APND)** com interface gráfica no navegador.

## Funcionalidades

**AFD**
- Montagem do autômato pelo usuário (estados, transições, estado inicial e finais)
- Visualização gráfica dos estados e transições em um canvas
- Arrastar estados para reorganizar o diagrama
- Teste de palavras com animação passo a passo
- Indicação visual se a palavra foi aceita ou rejeitada

**APND**
- Montagem do autômato com pilha (estados, transições com operações de pilha, símbolo inicial)
- Suporte a ε-transições
- Escolha do critério de aceitação: por estado final ou por pilha vazia
- Painel de simulação mostrando estado atual, entrada restante e conteúdo da pilha a cada passo

## Como usar

1. Abra o arquivo `index.html` no navegador
2. **Parte 1 — AFD:** preencha estados, estado inicial, estados finais e transições no formato `estado,símbolo,destino`
3. **Parte 2 — APND:** preencha os mesmos campos mais o símbolo inicial da pilha e as transições no formato `estado,símbolo_lido,topo_pilha,destino,empilhar` (use `&` para ε)
4. Clique em **Gerar Autômato** e depois digite uma palavra para testar

## Estrutura dos arquivos

```
/
├── index.html    # Estrutura da página
├── style.css     # Estilização
└── automato.js   # Lógica do autômato e desenho no canvas
```

## Tecnologias

- HTML
- CSS
- JavaScript (puro, sem bibliotecas)
