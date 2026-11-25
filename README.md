# Cat Solitarie 🐾

Paciência Spider para desktop e celular, feito com HTML, CSS e JavaScript. O objetivo é completar oito sequências do rei ao ás, cada uma com cartas do mesmo naipe.

## Jogar no computador

Baixe o projeto, extraia o ZIP e abra o arquivo `index.html` no navegador. Mantenha a pasta `audio` junto dos demais arquivos. O jogo funciona offline e dispensa instalação de dependências.

## Controles

- **Clique ou toque** em uma carta aberta e depois na coluna de destino. Uma carta pode ser colocada sobre outra de valor imediatamente maior.
- **Arraste com o mouse** para mover uma carta ou uma sequência decrescente do mesmo naipe.
- **Clique ou toque duas vezes** para encaixar automaticamente. O jogo prefere a sequência aberta mais longa. Em caso de empate, prefere o mesmo naipe.
- **Comprar 10** distribui uma carta por coluna. Preencha as colunas vazias antes de comprar.
- Use **Dica** para destacar uma jogada ou **Desfazer** para voltar uma ação.

## Modos e recordes

Escolha um, dois ou quatro naipes. A partida começa com 500 pontos. Cada jogada custa um ponto e cada sequência completa rende 100. Os recordes de pontuação e tempo ficam separados por dificuldade.

A mesa, os recordes e as preferências ficam no `localStorage` do navegador. O cronômetro pausa no lobby, nos menus e quando a aba está oculta. Nas configurações da mesa, você pode mudar o tamanho das cartas, regular o volume e experimentar os efeitos de carta, compra e dica.

## Arquivos

| Arquivo | Função |
| --- | --- |
| `index.html` | Lobby, mesa e menus |
| `style.css` | Layout responsivo, cartas e efeitos visuais |
| `game.js` | Regras, controles, animações, áudio e salvamento |
| `audio/` | Efeitos locais de toque, distribuição e dica em WAV |
| `felisnoc.png` | Logo usada na interface e no baralho |

## GitHub Pages

Para publicar a versão do ZIP, coloque o conteúdo extraído na raiz do repositório, com `index.html` ao lado deste README. Nas configurações do Pages, selecione a publicação pela branch que contém os arquivos e a pasta raiz.
