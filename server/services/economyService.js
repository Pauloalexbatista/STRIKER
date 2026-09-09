import { db } from '../db/database.js';

export const EconomyService = {
  // Apito Inicial: Bloqueia apostas e revela palpites. NÃO mexe no saldo!
  lockGameAtKickoff(gameId) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return { error: 'Jogo não encontrado' };
    if (game.status !== 'UPCOMING') return game;

    // Coloca jogo em DIRECTO
    db.prepare('UPDATE games SET status = "LIVE" WHERE id = ?').run(gameId);

    // Contabiliza total de apostas para formar o pote do jogo
    const bets = db.prepare('SELECT * FROM predictions WHERE game_id = ?').all(gameId);
    const pool = Number((bets.length * 1.00).toFixed(2));
    db.prepare('UPDATE games SET pool_points = ? WHERE id = ?').run(pool, gameId);

    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  },

  // Apito Final: As contas fazem-se AQUI!
  // - Quem acertou: ganha (Pote / Vencedores) -> ex: 10 / 2 = +5.00 pts directos no saldo!
  // - Quem errou: perde 1.00 pt -> -1.00 pt no saldo!
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

    const bets = db.prepare('SELECT * FROM predictions WHERE game_id = ?').all(gameId);
    const totalBettors = bets.length;
    const pool = Number((totalBettors * 1.00).toFixed(2));

    const winners = bets.filter(b => b.choice === result);
    const losers = bets.filter(b => b.choice !== result);
    const numWinners = winners.length;

    let pointsPerWinner = 0.00;
    if (numWinners > 0) {
      pointsPerWinner = Number((pool / numWinners).toFixed(2));
    }

    // 1. Processar VENCEDORES: cada um recebe a sua fatia completa do pote (ex: +5.00 pts)
    for (const winner of winners) {
      db.prepare(`
        UPDATE predictions 
        SET points_won = ?, net_points = ? 
        WHERE id = ?
      `).run(pointsPerWinner, pointsPerWinner, winner.id);

      db.prepare(`
        UPDATE users 
        SET balance = ROUND(balance + ?, 2) 
        WHERE id = ?
      `).run(pointsPerWinner, winner.user_id);
    }

    // 2. Processar DERROTAS: cada um perde 1 ponto (-1.00 pt)
    for (const loser of losers) {
      db.prepare(`
        UPDATE predictions 
        SET points_won = 0.00, net_points = -1.00 
        WHERE id = ?
      `).run(loser.id);

      db.prepare(`
        UPDATE users 
        SET balance = ROUND(balance - 1.00, 2) 
        WHERE id = ?
      `).run(loser.user_id);
    }

    // Actualizar estado final do jogo
    db.prepare(`
      UPDATE games 
      SET status = 'FINISHED', home_score = ?, away_score = ?, result = ?, pool_points = ? 
      WHERE id = ?
    `).run(homeScore, awayScore, result, pool, gameId);

    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  },

  // Repor jogo para UPCOMING (reverte saldos se tinha sido finalizado)
  resetGame(gameId) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return { error: 'Jogo não encontrado' };

    if (game.status === 'FINISHED') {
      const bets = db.prepare('SELECT * FROM predictions WHERE game_id = ?').all(gameId);
      for (const bet of bets) {
        if (bet.net_points > 0) {
          // Retirar pontos que tinham sido creditados
          db.prepare('UPDATE users SET balance = ROUND(balance - ?, 2) WHERE id = ?').run(bet.net_points, bet.user_id);
        } else if (bet.net_points === -1.00) {
          // Devolver 1 ponto que tinha sido retirado
          db.prepare('UPDATE users SET balance = ROUND(balance + 1.00, 2) WHERE id = ?').run(bet.user_id);
        }
      }
    }

    db.prepare('UPDATE predictions SET deducted = 0, points_won = 0.00, net_points = 0.00 WHERE game_id = ?').run(gameId);
    db.prepare('UPDATE games SET status = "UPCOMING", home_score = NULL, away_score = NULL, result = NULL, pool_points = 0.00 WHERE id = ?').run(gameId);
    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  }
};
