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

    // 1. Obter todas as ligas com palpites para este jogo
    const leaguesWithBets = db.prepare(`
      SELECT DISTINCT league_id FROM predictions WHERE game_id = ?
    `).all(gameId);

    // 2. Processar a divisão do pote dentro de CADA liga
    for (const { league_id } of leaguesWithBets) {
      const bets = db.prepare(`
        SELECT * FROM predictions WHERE game_id = ? AND league_id = ?
      `).all(gameId, league_id);

      const totalBettors = bets.length;
      const pool = Number((totalBettors * 1.00).toFixed(2));

      const winners = bets.filter(b => b.choice === result);
      const losers = bets.filter(b => b.choice !== result);
      const numWinners = winners.length;

      let pointsPerWinner = 0.00;
      if (numWinners > 0) {
        pointsPerWinner = Number((pool / numWinners).toFixed(2));
      }

      // Vencedores da Liga
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
        `).run(pointsPerWinner, league_id, winner.user_id);
      }

      // Perdedores da Liga
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
        `).run(league_id, loser.user_id);
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
