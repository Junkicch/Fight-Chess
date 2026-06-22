# Roteiro — Video de 5 min: Fight-Chess

## 1. Abertura (0:00–0:30)

**Cena**: Tela do menu principal mostrando as opções.

**Fala**:
"Já imaginou se, no xadrez, capturar uma peça significasse ter que enfrentar o adversário em uma luta? Foi essa a ideia por trás do Fight-Chess — um jogo que funde xadrez clássico com brawler em tempo real. Cada peça no tabuleiro é um lutador de Street Fighter 3, e cada captura ativa uma batalha side-scrolling para decidir quem fica com a casa."

---

## 2. Gameplay — Xadrez (0:30–1:30)

**Cena**: Partida em andamento no tabuleiro, movimento de peças com drag-and-drop, destaque de casas disponíveis.

**Fala**:
"O xadrez segue as regras tradicionais: movimentação de peças, xeque, xeque-mate, roque, en passant e promoção de peão. Dá pra jogar contra a CPU — que usa uma IA gulosa priorizando capturas — ou em multiplayer local de passa-e-repassa. Também temos multiplayer online com matchmaking via Socket.IO, onde cada movimento é enviado em tempo real para o oponente."

---

## 3. Transição — Captura (1:30–2:00)

**Cena**: Jogador captura uma peça → tela escurece → tela de carregamento da luta.

**Fala**:
"Quando uma captura acontece, o jogo pausa o tabuleiro e carrega a arena de luta. O atacante e o defensor são determinados — e seus lutadores são escolhidos automaticamente com base no tipo da peça. Um rei vira o Akuma, uma rainha vira o Ken, um cavalo vira o Dudley, e por aí vai."

---

## 4. Gameplay — Luta (2:00–3:30)

**Cena**: Batalha 2D acontecendo, mostrando movimentação, ataques, bloqueio, knockback, HUD de HP.

**Fala**:
"Na arena, cada jogador controla seu lutador em uma batalha side-scrolling com direito a pulo, agachamento, seis tipos de ataque — socos e chutes leves, médios e pesados — e bloqueio. Cada lutador tem 300 de HP, e o dano varia por região: 30% na cabeça, 10% no tronco e 5% nos pés. Acertos causam knockback e stun, impedindo o oponente de agir por um momento. A CPU também controla o lutador adversário no modo singleplayer."

---

## 5. Resultado e Volta ao Tabuleiro (3:30–4:00)

**Cena**: Nocaute, tela de resultado, volta ao tabuleiro com a peça capturada removida ou o ataque repelido.

**Fala**:
"Se o atacante vencer, a captura é confirmada e a peça sai do tabuleiro. Se o defensor vencer, o ataque é repelido e a peça permanece. É uma camada extra de estratégia — às vezes vale a pena arriscar um ataque, às vezes é melhor recuar."

---

## 6. Encerramento (4:00–5:00)

**Cena**: Ciclo rápido do jogo (menu → xadrez → luta → resultado), rolagem de créditos ao fundo.

**Fala**:
"O Fight-Chess foi construído com Phaser 3, TypeScript, Vite e Socket.IO. O código é aberto e está no GitHub. Os sprites são do Street Fighter 3: Third Strike — da Capcom — então é um projeto de fã, sem nenhum vínculo oficial. Se quiser experimentar, é só clonar o repositório, rodar `npm install && npm run dev`, e começar a jogar. Obrigado!"

---

## Notas de Produção

| Tempo | Cena | Observações |
|-------|------|-------------|
| 0:00–0:30 | Menu | Mostrar cursor passando pelos botões |
| 0:30–1:30 | Tabuleiro | Foco no drag-and-drop, destaque de movimento, xeque |
| 1:30–2:00 | Transição | Efeito de fade, tela de loading rápida |
| 2:00–3:30 | Luta | Mostrar pelo menos 2 personagens diferentes; destacar HP baixando e block |
| 3:30–4:00 | Resultado | Transição suave de volta ao tabuleiro |
| 4:00–5:00 | Montagem + Créditos | Loop de gameplay acelerado, créditos no canto inferior |

Duração estimada total: **5 min**. Ajustar ritmo conforme a edição.
