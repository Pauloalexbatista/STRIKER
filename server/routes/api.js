import express from 'express';
import { db } from '../db/database.js';
import { EconomyService } from '../services/economyService.js';

export const router = express.Router();

// 1. Get clubs
router.get('/clubs', (req, res) => {
  const clubs = db.prepare('SELECT * FROM clubs ORDER BY name ASC').all();
  res.json(clubs);
});

// 2. Get all users and current active user
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY balance DESC').all();
  res.json(users);
});

// 3. Switch active user or update favorite club
router.post('/users/update-club', (req, res) => {
  const { userId, clubId } = req.body;
  if (!userId || !clubId) return res.status(400).json({ error: 'Missing parameters' });
  
  db.prepare('UPDATE users SET favorite_club = ? WHERE id = ?').run(clubId, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json(user);
});

// 4. Get games with club info and current user predictions
router.get('/games', (req, res) => {
  const round = req.query.round ? parseInt(req.query.round) : 25;
  const userId = req.query.userId || 'u1';

  const games = db.prepare(`
    SELECT 
      g.*,
      hc.name as home_name, hc.short_name as home_short, hc.primary_color as home_color, hc.accent_color as home_accent,
      ac.name as away_name, ac.short_name as away_short, ac.primary_color as away_color, ac.accent_color as away_accent,
      p.choice as user_prediction, p.points_won as user_points_won, p.net_points as user_net_points
    FROM games g
    JOIN clubs hc ON g.home_club_id = hc.id
    JOIN clubs ac ON g.away_club_id = ac.id
    LEFT JOIN predictions p ON p.game_id = g.id AND p.user_id = ?
    WHERE g.round = ?
    ORDER BY g.kickoff_time ASC
  `).all(userId, round);

  res.json(games);
});

// 5. Place or update prediction
router.post('/predictions', (req, res) => {
  const { userId, gameId, choice } = req.body;
  if (!userId || !gameId || !choice) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });

  // Verify if match has started
  const now = new Date().toISOString();
  if (game.status !== 'UPCOMING' || new Date(game.kickoff_time) <= new Date()) {
    return res.status(400).json({ error: 'O jogo já iniciou! As apostas fecharam ao apito inicial.' });
  }

  const existing = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  if (existing) {
    db.prepare('UPDATE predictions SET choice = ?, created_at = ? WHERE id = ?').run(choice, now, existing.id);
  } else {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    db.prepare(`
      INSERT INTO predictions (id, user_id, game_id, choice, created_at, deducted, points_won, net_points)
      VALUES (?, ?, ?, ?, ?, 0, 0.00, 0.00)
    `).run(id, userId, gameId, choice, now);
  }

  const pred = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  res.json({ success: true, prediction: pred });
});

// 6. 3-Column dynamic drawer report
router.get('/games/:id/report', (req, res) => {
  const gameId = req.params.id;
  const game = db.prepare(`
    SELECT g.*, 
      hc.name as home_name, hc.short_name as home_short, hc.primary_color as home_color, hc.accent_color as home_accent,
      ac.name as away_name, ac.short_name as away_short, ac.primary_color as away_color, ac.accent_color as away_accent
    FROM games g
    JOIN clubs hc ON g.home_club_id = hc.id
    JOIN clubs ac ON g.away_club_id = ac.id
    WHERE g.id = ?
  `).get(gameId);

  if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });

  const bets = db.prepare(`
    SELECT p.*, u.name as user_name, u.avatar as user_avatar, u.favorite_club as user_club
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.game_id = ?
  `).all(gameId);

  const homeBets = bets.filter(b => b.choice === 'HOME');
  const drawBets = bets.filter(b => b.choice === 'DRAW');
  const awayBets = bets.filter(b => b.choice === 'AWAY');

  const totalBets = bets.length;
  const pool = totalBets * 1.00;

  // If UPCOMING: Names are SECRET! Only counts are revealed.
  if (game.status === 'UPCOMING') {
    return res.json({
      game,
      isLocked: false,
      totalBets,
      poolPoints: pool,
      columns: {
        home: { title: game.home_short, count: homeBets.length, bets: [] },
        draw: { title: 'EMPATE', count: drawBets.length, bets: [] },
        away: { title: game.away_short, count: awayBets.length, bets: [] }
      },
      secretNotice: 'Apostas secretas até ao apito inicial.'
    });
  }

  // If LIVE or FINISHED: Names are REVEALED
  return res.json({
    game,
    isLocked: true,
    totalBets,
    poolPoints: game.pool_points || pool,
    columns: {
      home: { title: game.home_short, count: homeBets.length, bets: homeBets },
      draw: { title: 'EMPATE', count: drawBets.length, bets: drawBets },
      away: { title: game.away_short, count: awayBets.length, bets: awayBets }
    }
  });
});

// 7. Leaderboard: Top da Jornada
router.get('/leaderboard/round/:round', (req, res) => {
  const round = parseInt(req.params.round);
  
  // Calculate points gained in this specific round
  const roundResults = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar, u.favorite_club,
      ROUND(SUM(p.net_points), 2) as round_points,
      COUNT(CASE WHEN p.net_points > 0 THEN 1 END) as round_wins,
      COUNT(p.id) as round_bets
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN games g ON p.game_id = g.id AND g.round = ? AND g.status = 'FINISHED'
    GROUP BY u.id
    ORDER BY round_points DESC, round_wins DESC
  `).all(round);

  res.json({
    round,
    leaderboard: roundResults
  });
});

// 8. Leaderboard: Top Striker Geral
router.get('/leaderboard/general', (req, res) => {
  const leaders = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar, u.favorite_club, u.balance,
      COUNT(p.id) as total_bets,
      COUNT(CASE WHEN p.net_points > 0 THEN 1 END) as wins,
      CASE 
        WHEN COUNT(p.id) > 0 THEN ROUND((COUNT(CASE WHEN p.net_points > 0 THEN 1 END) * 100.0) / COUNT(p.id), 1)
        ELSE 0.0
      END as efficiency_pct
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id AND p.deducted = 1
    GROUP BY u.id
    ORDER BY u.balance DESC, efficiency_pct DESC
  `).all();

  res.json(leaders);
});

// 9. Simulation / Admin controls
router.post('/admin/games/:id/lock', (req, res) => {
  const result = EconomyService.lockGameAtKickoff(req.params.id);
  res.json(result);
});

router.post('/admin/games/:id/settle', (req, res) => {
  const { homeScore, awayScore } = req.body;
  const result = EconomyService.settleGame(req.params.id, parseInt(homeScore), parseInt(awayScore));
  res.json(result);
});

router.post('/admin/games/:id/reset', (req, res) => {
  const result = EconomyService.resetGame(req.params.id);
  res.json(result);
});
