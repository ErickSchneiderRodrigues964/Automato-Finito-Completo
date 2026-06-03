# Autômato Finito

Projeto acadêmico que implementa um **Autômato Finito Determinístico (AFD)** com interface gráfica no navegador.

## Funcionalidades

- Montagem do autômato pelo usuário (estados, transições, estado inicial e finais)
- Visualização gráfica dos estados e transições em um canvas
- Arrastar estados para reorganizar o diagrama
- Teste de palavras com animação passo a passo
- Indicação visual se a palavra foi **aceita** ou **rejeitada**

## Como usar

1. Abra o arquivo `index.html` no navegador
2. Preencha os campos:
   - **Estados:** liste todos os estados separados por vírgula
   - **Estado inicial:** o estado de partida
   - **Estados finais:** estados de aceitação, separados por vírgula
   - **Transições:** uma por linha, no formato `estado,símbolo,destino`
3. Clique em **Gerar Autômato**
4. Na seção de teste, digite uma palavra e clique em **Testar**

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
