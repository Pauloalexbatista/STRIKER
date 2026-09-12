# ⚽ STRIKER - Game Specification & Architecture Master Plan

> **Documento Central de Especificações Técnicas, Regras de Jogo & UX**  
> *Versão:* 2.0 — Regras Oficiais (+3, -1, -2, Bónus +3), Sincronização 5m em Direto, Cartão com Glow e Gestão Completa de Ligas.

---

## 1. Identidade, Conceito & Plataforma
* **Nome Oficial:** **STRIKER** *(avançado goleador / ponta-de-lança matador)*.
* **Plataforma:** WebApp Mobile-First (PWA com suporte a "Adicionar ao Ecrã Principal" no smartphone).
* **Hospedagem & Portal:** VPS próprio (`testeweb.site`), integrado como 3º jogo no portal néon ao lado de *Oficina Pinball* e *Mini F1 Racing*.
* **Identidade Visual Imersiva (Cores Oficiais dos Clubes):**
  * 🟢⚪ **Sporting CP:** Verde e Branco vibrante.
  * 🔴⚪ **SL Benfica:** Vermelho e Branco intenso.
  * 🔵⚪ **FC Porto:** Azul e Branco clássico e forte.
  * 🟡⚡ **Striker Gold:** Dourado e Preto / Acentos néon.

---

## 2. Economia e Sistema Oficial de Pontuação

* **Todos começam com 0 pontos:**
  * Jogador inicial da época ou novo membro de uma liga: começam com **0 pontos**.
* **Palpites 1 X 2 Gratuitos:**
  * Colocar palpites NÃO retira pontos do saldo do jogador.
* **Pontuação por Jogo:**
  * **Acertou no prognóstico (1, X ou 2):** `+3 pontos`
  * **Errou no prognóstico:** `-1 ponto`
  * **Não apostou a tempo (Falta):** `-2 pontos`
* **Bónus Campeão da Jornada (+3 pontos extra):**
  * Assim que o último jogo da jornada termina, o sistema verifica automaticamente quem fez mais pontos na jornada em cada liga.
  * O vencedor da jornada (ou todos os empatados no 1º lugar) recebe **+3 pontos extra** creditados na classificação geral!

---

## 3. Feed de Jogos na Timeline (Mobile UX)

* **Organização:** Lista cronológica por data e hora de jogo.
* **Fecho ao Segundo:** Cada jogo fecha individualmente no apito inicial (com contagem decrescente).
* **Estados do Cartão de Jogo:**
  1. `🟢 Aposta Aberta (pode alterar) • Aposta Secreta`
  2. `🔒 Aposta Fechada • Palpites Revelados` (Ao Vivo)
  3. `🏁 Cartão Fechado • Resultados Concluídos` (Terminado)
* **Cartão com Contorno Ativo:** O cartão ilumina o seu contorno na cor do clube do jogador assim que o palpite é registado.
* **Ver Palpites (3 Colunas):**
  * Bloqueado antes do jogo.
  * Desbloqueado ao apito inicial com nomes completos de quem votou em 1, X e 2.
  * Indicador de presença da liga: lista quem não apostou (-2 pts).
