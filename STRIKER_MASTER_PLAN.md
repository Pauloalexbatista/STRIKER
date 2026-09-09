# ⚽ STRIKER - Game Specification & Architecture Master Plan

> **Documento Central de Especificações Técnicas, Regras de Jogo & UX**  
> *Versão:* 1.4 — Pontuação Base 0, Timeline Mobile com Nomes de Equipas, Relatório 3 Colunas Dinâmico por Clube e Integração Portal.

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
  * **Regra de Coerência Visual:** O cartão de resultados, a gaveta do relatório das 3 colunas e os botões acompanham e adaptam-se dinamicamente às cores do clube ativo do utilizador.

---

## 2. Nova Economia: Sistema de Pontuação a Começar no ZERO (0.00 pts)

* **Todos começam com 0.00 pontos:**
  * Jogador inicial da época ou novo jogador a meio da época: começam com **0.00 pts**.
* **Mecânica por Jogo:**
  * **Errou o prognóstico:** `-1.00 pt`.
  * **Não apostou a tempo:** `-1.00 pt`.
  * **Acertou:** Recebe a sua fatia equitativa do pote do grupo (ex: 10 apostadores = 10 pts; se 2 acertarem, cada um recebe `+5.00` brutos, resultando em `+4.00` de lucro líquido!).
* **Precisão:** Sempre calculado e exibido com **2 casas decimais**.

---

## 3. Feed de Jogos na Timeline (Mobile UX)

* **Organização:** Lista cronológica por data e hora de jogo.
* **Fecho ao Segundo:** Cada jogo fecha individualmente no apito inicial (com contagem decrescente `⏳`).
* **Botões Claros e Diretos:**
  * `[ SPORTING CP ]` (Vitória Casa)
  * `[ EMPATE ]` (Igualdade)
  * `[ SC BRAGA ]` (Vitória Fora)
* **Ícone de Relatório (📊):**
  * Abre gaveta com as **3 colunas** (Casa, Empate, Fora).
  * Antes do apito: apostas secretas.
  * Ao apito: apostas reveladas, cada jogador registado com `-1.00 pt`.
  * Ao apito final: os vencedores destacam-se com os pontos líquidos ganhos (`+X.XX`).

---

## 4. Classificações e Rankings

1. **Top da Jornada (Semanal):** Seletor de jornadas (1 a 34), pódio da semana e galeria com o total de vitórias de jornada (*TOPs*).
2. **Leaderboard Geral (Top Striker):** Tabela acumulada do saldo total (positivo/lucro ou negativo/prejuízo) e % de eficácia.

---

## 5. Próxima Sessão (Fase de Desenvolvimento)
1. Reabertura do projeto após renomear a pasta para `PRJT Striker`.
2. Leitura deste `STRIKER_MASTER_PLAN.md`.
3. Definição da stack técnica (Frontend Vue/React/Vite mobile-first + Backend leve/FastAPI/Node + SQLite/Postgres para campeonatos e utilizadores).
4. Configuração dos cartões com as cores temáticas completas.
