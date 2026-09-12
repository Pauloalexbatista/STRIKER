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

  // Finalizar jogo e processar potes de cada liga de forma isolada
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

      const totalBettors = bets.length;
      const pool = Number((totalBettors * 1.00).toFixed(2));

      const winners = bets.filter(b => b.choice === result);
      const losers = bets.filter(b => b.choice !== result);
      const numWinners = winners.length;

      let pointsPerWinner = 0.00;
      if (numWinners > 0) {
        pointsPerWinner = Number((pool / numWinners).toFixed(2));
      }

      // Vencedores da Liga (dividem o pote)
      for (const winner of winners) {
        db.prepare(`
          UPDATE predictions 
          SET points_won = ?, net_points = ? 
          WHERE id = ?
        `).run(pointsPerWinner, pointsPerWinner, winner.id);

        db.prepare(`
          UPDATE league_members 
          SET balance = ROUND(balance + ?, 2) 
          WHERE league_id = ? AND user_id = ?
        `).run(pointsPerWinner, leagueId, winner.user_id);
      }

      // Perdedores da Liga (-1.00 pt)
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

      // Membros da Liga que NÃO apostaram (-2.00 pts por falta)
      // Apenas aplicamos se a liga tiver pelo menos 1 aposta registada ou membros ativos
      if (totalBettors > 0) {
        const members = db.prepare('SELECT user_id FROM league_members WHERE league_id = ?').all(leagueId);
        const bettorIds = new Set(bets.map(b => b.user_id));

        for (const member of members) {
          if (!bettorIds.has(member.user_id)) {
            // Verificar se já existe penalização registada
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
    }

    // 3. Registar resultado oficial do jogo
    db.prepare(`
      UPDATE games 
      SET status = 'FINISHED', home_score = ?, away_score = ?, result = ? 
      WHERE id = ?
    `).run(homeScore, awayScore, result, gameId);

    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  }
};
