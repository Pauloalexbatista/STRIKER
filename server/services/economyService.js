import { db } from '../db/database.js';

export const EconomyService = {
  // Lock game at kickoff and deduct 1.00 pt for each active bettor
  lockGameAtKickoff(gameId) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return { error: 'Game not found' };
    if (game.status !== 'UPCOMING') return game;

    // Set game status to LIVE
    db.prepare('UPDATE games SET status = "LIVE" WHERE id = ?').run(gameId);

    // Get all bets for this game
    const bets = db.prepare('SELECT * FROM predictions WHERE game_id = ?').all(gameId);

    // Deduct 1.00 pt entry fee from each bettor if not already deducted
    for (const bet of bets) {
      if (!bet.deducted) {
        db.prepare('UPDATE users SET balance = ROUND(balance - 1.00, 2) WHERE id = ?').run(bet.user_id);
        db.prepare('UPDATE predictions SET deducted = 1, net_points = -1.00 WHERE id = ?').run(bet.id);
      }
    }

    // Pool points = 1.00 pt * number of bets
    const pool = bets.length * 1.00;
    db.prepare('UPDATE games SET pool_points = ? WHERE id = ?').run(pool, gameId);

    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  },

  // Settle game results and distribute the pool equally among winners
  settleGame(gameId, homeScore, awayScore) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return { error: 'Game not found' };

    let result = 'DRAW';
    if (homeScore > awayScore) result = 'HOME';
    else if (awayScore > homeScore) result = 'AWAY';

    // First ensure it was locked
    if (game.status === 'UPCOMING') {
      this.lockGameAtKickoff(gameId);
    }

    const bets = db.prepare('SELECT * FROM predictions WHERE game_id = ?').all(gameId);
    const totalBettors = bets.length;
    const pool = totalBettors * 1.00;

    const winners = bets.filter(b => b.choice === result);
    const numWinners = winners.length;

    let pointsPerWinner = 0.00;
    if (numWinners > 0) {
      pointsPerWinner = Number((pool / numWinners).toFixed(2));
    }

    // Update winners
    for (const winner of winners) {
      const netPoints = Number((pointsPerWinner - 1.00).toFixed(2));
      db.prepare(`
        UPDATE predictions 
        SET points_won = ?, net_points = ? 
        WHERE id = ?
      `).run(pointsPerWinner, netPoints, winner.id);

      db.prepare(`
        UPDATE users 
        SET balance = ROUND(balance + ?, 2) 
        WHERE id = ?
      `).run(pointsPerWinner, winner.user_id);
    }

    // Update losers (net_points remains -1.00)
    const losers = bets.filter(b => b.choice !== result);
    for (const loser of losers) {
      db.prepare(`
        UPDATE predictions 
        SET points_won = 0.00, net_points = -1.00 
        WHERE id = ?
      `).run(loser.id);
    }

    // Update game status
    db.prepare(`
      UPDATE games 
      SET status = 'FINISHED', home_score = ?, away_score = ?, result = ?, pool_points = ? 
      WHERE id = ?
    `).run(homeScore, awayScore, result, pool, gameId);

    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  },

  // Reset a game back to UPCOMING for simulation purposes
  resetGame(gameId) {
    const bets = db.prepare('SELECT * FROM predictions WHERE game_id = ?').all(gameId);
    // Reverse any balance modifications
    for (const bet of bets) {
      if (bet.deducted) {
        db.prepare('UPDATE users SET balance = ROUND(balance + 1.00, 2) WHERE id = ?').run(bet.user_id);
      }
      if (bet.points_won > 0) {
        db.prepare('UPDATE users SET balance = ROUND(balance - ?, 2) WHERE id = ?').run(bet.points_won, bet.user_id);
      }
    }

    db.prepare('UPDATE predictions SET deducted = 0, points_won = 0.00, net_points = 0.00 WHERE game_id = ?').run(gameId);
    db.prepare('UPDATE games SET status = "UPCOMING", home_score = NULL, away_score = NULL, result = NULL, pool_points = 0.00 WHERE id = ?').run(gameId);
    return db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  }
};
