# ⚽ STRIKER - Game Specification & Architecture Master Plan

> **Documento Central de Especificações Técnicas, Regras de Jogo & UX**  
> *Versão:* 2.5 — Regras Oficiais (+3, -1, -2, Bónus +3), Sincronização 1m em Direto, Cartão com Glow, Gestão Completa de Ligas e Eliminação em Cascata.

---

## 1. Identidade, Conceito & Plataforma
* **Nome Oficial:** **STRIKER** *(avançado goleador / ponta-de-lança matador)*.
* **Plataforma:** WebApp Mobile-First (PWA com suporte a "Adicionar ao Ecrã Principal" no smartphone).
* **Hospedagem & Portal:** VPS próprio Coolify (`striker.testeweb.site`), integrado no portal néon ao lado de *Oficina Pinball* e *Mini F1 Racing*.
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
* **Cartão com Contorno Ativo (Glow):** O cartão ilumina o seu contorno na cor do clube do jogador assim que o palpite é registado.
* **Ver Palpites (3 Colunas):**
  * Bloqueado antes do jogo (apenas contagens agregadas).
  * Desbloqueado ao apito inicial com nomes completos de quem votou em 1, X e 2.
  * Espaço maximizado para dispositivos móveis: rótulo `"em jogo"` retirado para dar 100% de largura aos nomes dos jogadores sem cortes.
  * Indicador de presença da liga: lista quem não apostou (-2 pts no apito final).

---

## 4. Gestão de Campeonatos e Ligas Privadas

* **Criação de Ligas:** Até 3 campeonatos criados por utilizador com códigos de convite únicos.
* **Acesso por Convite:** Entrada rápida via link direto (`?liga=CODIGO`) ou código no modal.
* **Apagar Campeonato:**
  * O criador da liga (ou administrador) pode apagar a liga através do botão de caixote do lixo (`Trash2`).
  * Processo em cascata seguro com bypass temporário de foreign keys: elimina palpites, bónus de jornada e membros associados à liga.
  * Recálculo imediato de quotas e saldos dos utilizadores.
* **Sair do Campeonato:**
  * Participantes convidados podem abandonar a liga individualmente através do botão `LogOut`.

---

## 5. Arquitetura de Sincronização em Tempo Real (API Futebol)

* **Fonte de Dados:** API oficial `football-data.org` (Liga Portugal PPL).
* **Intervalo de Robô:** Sincronização periódica no backend a cada **1 minuto** (`startAutoSync(1)`).
* **Auto-Refresh Silencioso no Cliente:** O `TimelineFeed.jsx` atualiza os resultados a cada **30 segundos** sem loaders intrusivos nem saltos no ecrã.
* **Deteção Inteligente de Apito Final:** Reconhece o fim do jogo quando o estado é `FINISHED` ou quando a API já definiu o `winner` e o tempo decorrido ultrapassa 105 minutos.
* **Cache Busting:** Ficheiro `build-version.json` incrementado a cada deploy para forçar a atualização instantânea de assets no browser e PWA.

---

## 6. Registo de Implementações da Sessão (12 de Setembro de 2026)

1. **Implementação das Regras Oficiais (+3 / -1 / -2 / Bónus +3):**
   - Transição do modelo antigo de "taxa e pote" para pontuação direta e fixa.
   - Atribuição automática do bónus de jornada quando os 9 jogos fecham.
2. **Sincronização com a API e Resolução de Erros de Base de Dados:**
   - Mapeamento de todos os clubes da Primeira Liga.
   - Correção de constrangimento de base de dados SQLite (`UNIQUE(user_id, game_id)` migrado para `UNIQUE(user_id, game_id, league_id)`).
   - Blindagem contra falhas com `INSERT OR IGNORE` e cascata segura em deleções.
   - Resolução da atualização do jogo Casa Pia vs FC Porto (1-4).
3. **Otimizações Mobile:**
   - Retirado o badge `PRO` do cabeçalho para libertar espaço horizontal aos pontos e nome do jogador.
   - Retirado o badge `"em jogo"` no modal de 3 colunas para garantir legibilidade de nomes.
4. **Gestão de Ligas:**
   - Implementado o botão de apagar liga com modal de confirmação.
   - Implementado o botão de sair da liga para membros.
