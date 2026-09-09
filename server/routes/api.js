import express from 'express';
import { db } from '../db/database.js';
import { EconomyService } from '../services/economyService.js';

export const router = express.Router();

// 1. Auth: Login ou Registo Rápido (Família & Amigos)
router.post('/auth/login', (req, res) => {
  const { name, pin, favoriteClub } = req.body;
  if (!name || !pin) {
    return res.status(400).json({ error: 'Nome e PIN são obrigatórios' });
  }

  const cleanName = name.trim();
  const cleanPin = pin.trim();

  // Procurar utilizador existente pelo nome (case-insensitive)
  const existing = db.prepare('SELECT * FROM users WHERE LOWER(name) = LOWER(?)').get(cleanName);

  if (existing) {
    if (existing.pin !== cleanPin) {
      return res.status(401).json({ error: 'PIN incorreto para este nome!' });
    }
    return res.json({ user: existing, isNew: false });
  }

  // Se não existe, cria um novo jogador com 0.00 pts
  const clubAvatars = {
    SCP: '🦁', SLB: '🦅', FCP: '🐉', SCB: '⚔️', VSC: '🛡️', GOLD: '⚡'
  };

  const club = favoriteClub || 'SCP';
  const avatar = clubAvatars[club] || '⚽';
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, pin, favorite_club, balance, avatar, created_at)
    VALUES (?, ?, ?, ?, 0.00, ?, ?)
  `).run(id, cleanName, cleanPin, club, avatar, now);

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ user: newUser, isNew: true });
});

// 2. Obter lista de clubes
router.get('/clubs', (req, res) => {
  const clubs = db.prepare('SELECT * FROM clubs ORDER BY name ASC').all();
  res.json(clubs);
});

// 3. Obter utilizadores e ranking
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, favorite_club, avatar, balance FROM users ORDER BY balance DESC').all();
  res.json(users);
});

// 4. Mudar clube favorito do utilizador
router.post('/users/update-club', (req, res) => {
  const { userId, clubId } = req.body;
  if (!userId || !clubId) return res.status(400).json({ error: 'Parâmetros em falta' });
  
  const clubAvatars = { SCP: '🦁', SLB: '🦅', FCP: '🐉', SCB: '⚔️', VSC: '🛡️', GOLD: '⚡' };
  const avatar = clubAvatars[clubId] || '⚽';

  db.prepare('UPDATE users SET favorite_club = ?, avatar = ? WHERE id = ?').run(clubId, avatar, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json(user);
});

// 5. Obter jogos da jornada
router.get('/games', (req, res) => {
  const round = req.query.round ? parseInt(req.query.round) : 25;
  const userId = req.query.userId || '';

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

// 6. Colocar / Alterar palpite
router.post('/predictions', (req, res) => {
  const { userId, gameId, choice } = req.body;
  if (!userId || !gameId || !choice) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });

  // Bloqueio rigoroso ao apito inicial
  if (game.status !== 'UPCOMING' || new Date(game.kickoff_time) <= new Date()) {
    return res.status(400).json({ error: 'O jogo já iniciou! As apostas fecharam ao apito inicial.' });
  }

  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  
  if (existing) {
    db.prepare('UPDATE predictions SET choice = ?, created_at = ? WHERE id = ?').run(choice, now, existing.id);
  } else {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT INTO predictions (id, user_id, game_id, choice, created_at, deducted, points_won, net_points)
      VALUES (?, ?, ?, ?, ?, 0, 0.00, 0.00)
    `).run(id, userId, gameId, choice, now);
  }

  // Atualizar contagem do pote do jogo
  const totalBets = db.prepare('SELECT COUNT(*) as count FROM predictions WHERE game_id = ?').get(gameId).count;
  db.prepare('UPDATE games SET pool_points = ? WHERE id = ?').run(totalBets * 1.00, gameId);

  const pred = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  res.json({ success: true, prediction: pred });
});

// 7. Relatório das 3 colunas
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
      }
    });
  }

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

// 8. Rankings
router.get('/leaderboard/round/:round', (req, res) => {
  const round = parseInt(req.params.round);
  const roundResults = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar, u.favorite_club,
      COALESCE(ROUND(SUM(p.net_points), 2), 0.00) as round_points,
      COUNT(CASE WHEN p.net_points > 0 THEN 1 END) as round_wins,
      COUNT(p.id) as round_bets
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN games g ON p.game_id = g.id AND g.round = ? AND g.status = 'FINISHED'
    GROUP BY u.id
    ORDER BY round_points DESC, round_wins DESC
  `).all(round);

  res.json({ round, leaderboard: roundResults });
});

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
    LEFT JOIN predictions p ON p.user_id = u.id AND p.net_points != 0
    GROUP BY u.id
    ORDER BY u.balance DESC, efficiency_pct DESC
  `).all();

  res.json(leaders);
});

// 9. Admin / Simulação
router.post('/admin/games/:id/lock', (req, res) => {
  const result = EconomyService.lockGameAtKickoff(req.params.id);
  res.json(result);
});

router.post('/admin/games/:id/settle', (req, res) => {
  const { homeScore, awayScore } = req.body;
  const result = EconomyService.settleGame(req.params.id, parseInt(homeScore), parseInt(awayScore));
  res.json(result);
});
