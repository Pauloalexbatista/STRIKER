import { db } from '../db/database.js';

export const EconomyService = {
  // Bloquear jogo ao apito inicial
  lockGameAtKickoff(gameId) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return { error: 'Jogo não encontrado' };
    if (game.status !== 'UPCOMING') return game;

    db.prepare("UPDATE games SET status = 'LIVE' WHERE id = ?").run(gameId);
    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  },

  // Finalizar jogo e processar regras oficiais:
  // Acerto: +3 pts | Erro: -1 pt | Não apostou: -2 pts
  // Jornada fechada: Vencedor(es) da jornada recebem +3 pts extra de bónus!
  settleGame(gameId, homeScore, awayScore) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return { error: 'Jogo não encontrado' };

    let result = 'DRAW';
    if (homeScore > awayScore) result = 'HOME';
    else if (awayScore > homeScore) result = 'AWAY';

    // Se ainda estava UPCOMING, bloqueia primeiro
    if (game.status === 'UPCOMING') {
      this.lockGameAtKickoff(gameId);
    }

    // 1. Obter todas as ligas existentes para processar pontuações
    const allLeagues = db.prepare('SELECT id FROM leagues').all();
    const now = new Date().toISOString();

    // 2. Processar cada liga
    for (const { id: leagueId } of allLeagues) {
      const bets = db.prepare(`
        SELECT * FROM predictions WHERE game_id = ? AND league_id = ? AND choice != 'MISSED'
      `).all(gameId, leagueId);

      const winners = bets.filter(b => b.choice === result);
      const losers = bets.filter(b => b.choice !== result);

      // Vencedores da Liga (+3 pontos fixos)
      for (const winner of winners) {
        db.prepare(`
          UPDATE predictions 
          SET points_won = 3.00, net_points = 3.00 
          WHERE id = ?
        `).run(winner.id);

        db.prepare(`
          UPDATE league_members 
          SET balance = ROUND(balance + 3.00, 2) 
          WHERE league_id = ? AND user_id = ?
        `).run(leagueId, winner.user_id);
      }

      // Perdedores da Liga (-1 ponto fixo)
      for (const loser of losers) {
        db.prepare(`
          UPDATE predictions 
          SET points_won = 0.00, net_points = -1.00 
          WHERE id = ?
        `).run(loser.id);

        db.prepare(`
          UPDATE league_members 
          SET balance = ROUND(balance - 1.00, 2) 
          WHERE league_id = ? AND user_id = ?
        `).run(leagueId, loser.user_id);
      }

      // Membros da Liga que NÃO apostaram (-2 pontos por falta de aposta)
      const allMembers = db.prepare('SELECT user_id FROM league_members WHERE league_id = ?').all(leagueId);
      const bettorIds = new Set(bets.map(b => b.user_id));

      for (const member of allMembers) {
        if (!bettorIds.has(member.user_id)) {
          const existingMissed = db.prepare(`
            SELECT id FROM predictions WHERE game_id = ? AND league_id = ? AND user_id = ?
          `).get(gameId, leagueId, member.user_id);

          if (!existingMissed) {
            const missedId = 'missed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            db.prepare(`
              INSERT INTO predictions (id, user_id, game_id, league_id, choice, created_at, points_won, net_points)
              VALUES (?, ?, ?, ?, 'MISSED', ?, 0.00, -2.00)
            `).run(missedId, member.user_id, gameId, leagueId, now);

            db.prepare(`
              UPDATE league_members 
              SET balance = ROUND(balance - 2.00, 2) 
              WHERE league_id = ? AND user_id = ?
            `).run(leagueId, member.user_id);
          }
        }
      }
    }

    // 3. Registar resultado oficial do jogo
    db.prepare(`
      UPDATE games 
      SET status = 'FINISHED', home_score = ?, away_score = ?, result = ? 
      WHERE id = ?
    `).run(homeScore, awayScore, result, gameId);

    // 4. Verificar se a jornada está 100% concluída para atribuir o BÓNUS de Campeão da Jornada (+3 pts extra)
    this.checkAndAwardRoundBonus(game.round);

    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  },

  // Verificar fecho da jornada e atribuir +3 pontos extra ao campeão (ou empatados no 1º lugar)
  checkAndAwardRoundBonus(round) {
    // Verificar se ainda resta algum jogo não terminado nesta jornada
    const pendingGames = db.prepare(`
      SELECT COUNT(*) as count FROM games WHERE round = ? AND status != 'FINISHED'
    `).get(round).count;

    if (pendingGames > 0) {
      // Ainda há jogos por terminar na jornada
      return;
    }

    console.log(`🏆 Jornada ${round} 100% concluída! A verificar campeões de jornada...`);
    const allLeagues = db.prepare('SELECT id FROM leagues').all();
    const now = new Date().toISOString();

    for (const { id: leagueId } of allLeagues) {
      // Verificar se já foi atribuído o bónus desta jornada nesta liga
      const alreadyAwarded = db.prepare(`
        SELECT COUNT(*) as count FROM round_bonuses WHERE league_id = ? AND round = ?
      `).get(leagueId, round).count;

      if (alreadyAwarded > 0) {
        continue;
      }

      // Pontuação da jornada por membro
      const roundScores = db.prepare(`
        SELECT 
          lm.user_id,
          COALESCE(ROUND(SUM(p.net_points), 2), 0.00) as round_points
        FROM league_members lm
        JOIN predictions p ON p.user_id = lm.user_id AND p.league_id = lm.league_id
        JOIN games g ON p.game_id = g.id AND g.round = ? AND g.status = 'FINISHED'
        WHERE lm.league_id = ?
        GROUP BY lm.user_id
        ORDER BY round_points DESC
      `).all(round, leagueId);

      if (roundScores.length === 0) continue;

      const bestScore = roundScores[0].round_points;
      const winners = roundScores.filter(s => s.round_points === bestScore);

      for (const winner of winners) {
        const bonusId = 'bonus_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        db.prepare(`
          INSERT INTO round_bonuses (id, league_id, round, user_id, bonus_points, created_at)
          VALUES (?, ?, ?, ?, 3.00, ?)
        `).run(bonusId, leagueId, round, winner.user_id, now);

        db.prepare(`
          UPDATE league_members 
          SET balance = ROUND(balance + 3.00, 2) 
          WHERE league_id = ? AND user_id = ?
        `).run(leagueId, winner.user_id);

        console.log(`⭐ Bónus de +3 pts atribuído a ${winner.user_id} na liga ${leagueId} (Jornada ${round})`);
      }
    }
  }
};
