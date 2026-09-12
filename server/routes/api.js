import express from 'express';
import { db } from '../db/database.js';
import { EconomyService } from '../services/economyService.js';
import { FootballApiService } from '../services/footballApiService.js';

export const router = express.Router();

// 1. Auth: Login ou Registo RÃƒÆ’Ã‚Â¡pido
router.post('/auth/login', (req, res) => {
  const { name, pin, favoriteClub } = req.body;
  if (!name || !pin) {
    return res.status(400).json({ error: 'Nome e PIN sÃƒÆ’Ã‚Â£o obrigatÃƒÆ’Ã‚Â³rios' });
  }

  const cleanName = name.trim();
  const cleanPin = pin.trim();

  const existing = db.prepare('SELECT * FROM users WHERE LOWER(name) = LOWER(?)').get(cleanName);

  if (existing) {
    if (existing.pin !== cleanPin) {
      return res.status(401).json({ error: 'PIN incorreto para este nome!' });
    }
    return res.json({ user: existing, isNew: false });
  }

  const clubAvatars = {
    SCP: 'ÃƒÂ°Ã…Â¸Ã‚Â¦Ã‚Â', SLB: 'ÃƒÂ°Ã…Â¸Ã‚Â¦Ã¢â‚¬Â¦', FCP: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â°', SCB: 'ÃƒÂ¢Ã…Â¡Ã¢â‚¬ÂÃƒÂ¯Ã‚Â¸Ã‚Â', VSC: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â¡ÃƒÂ¯Ã‚Â¸Ã‚Â', GOLD: 'ÃƒÂ¢Ã…Â¡Ã‚Â¡'
  };

  const club = favoriteClub || 'SCP';
  const avatar = clubAvatars[club] || 'ÃƒÂ¢Ã…Â¡Ã‚Â½';
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, pin, favorite_club, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, cleanName, cleanPin, club, avatar, now);

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ user: newUser, isNew: true });
});

// 2. LIGAS: Criar Campeonato (MÃƒÆ’Ã‚Â¡ximo 3 por utilizador)
router.post('/leagues/create', (req, res) => {
  const { userId, name, code } = req.body;
  if (!userId || !name || !code) {
    return res.status(400).json({ error: 'Nome da liga e cÃƒÆ’Ã‚Â³digo de convite sÃƒÆ’Ã‚Â£o obrigatÃƒÆ’Ã‚Â³rios' });
  }

  // Verificar limite de 3 ligas criadas
  const createdCount = db.prepare('SELECT COUNT(*) as count FROM leagues WHERE creator_id = ?').get(userId).count;
  if (createdCount >= 3) {
    return res.status(400).json({ error: 'JÃƒÆ’Ã‚Â¡ atingiste o limite mÃƒÆ’Ã‚Â¡ximo de 3 campeonatos criados!' });
  }

  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (cleanCode.length < 3) {
    return res.status(400).json({ error: 'O cÃƒÆ’Ã‚Â³digo de convite deve ter pelo menos 3 caracteres' });
  }

  // Verificar se o cÃƒÆ’Ã‚Â³digo jÃƒÆ’Ã‚Â¡ existe
  const existingCode = db.prepare('SELECT * FROM leagues WHERE code = ?').get(cleanCode);
  if (existingCode) {
    return res.status(400).json({ error: 'Este cÃƒÆ’Ã‚Â³digo de convite jÃƒÆ’Ã‚Â¡ estÃƒÆ’Ã‚Â¡ a ser usado. Escolhe outro!' });
  }

  const leagueId = 'l_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO leagues (id, name, code, creator_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(leagueId, name.trim(), cleanCode, userId, now);

  // Adicionar o criador como 1Ãƒâ€šÃ‚Âº membro da liga com 0.00 pts
  db.prepare(`
    INSERT INTO league_members (league_id, user_id, balance, joined_at)
    VALUES (?, ?, 0.00, ?)
  `).run(leagueId, userId, now);

  const league = db.prepare('SELECT * FROM leagues WHERE id = ?').get(leagueId);
  res.json({ success: true, league });
});

// 3. LIGAS: Entrar numa Liga por CÃƒÆ’Ã‚Â³digo de Convite
router.post('/leagues/join', (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'CÃƒÆ’Ã‚Â³digo de convite obrigatÃƒÆ’Ã‚Â³rio' });
  }

  const cleanCode = code.trim().toUpperCase();
  const league = db.prepare('SELECT * FROM leagues WHERE code = ?').get(cleanCode);
  if (!league) {
    return res.status(404).json({ error: 'Campeonato nÃƒÆ’Ã‚Â£o encontrado com esse cÃƒÆ’Ã‚Â³digo de convite!' });
  }

  const isMember = db.prepare('SELECT * FROM league_members WHERE league_id = ? AND user_id = ?').get(league.id, userId);
  if (!isMember) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO league_members (league_id, user_id, balance, joined_at)
      VALUES (?, ?, 0.00, ?)
    `).run(league.id, userId, now);
  }

  res.json({ success: true, league });
});

// 4. LIGAS: Obter as minhas ligas
router.get('/leagues/my', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.json([]);

  const leagues = db.prepare(`
    SELECT 
      l.*,
      lm.balance as user_balance,
      (SELECT COUNT(*) FROM league_members WHERE league_id = l.id) as total_members,
      CASE WHEN l.creator_id = ? THEN 1 ELSE 0 END as is_creator
    FROM leagues l
    JOIN league_members lm ON l.id = lm.league_id
    WHERE lm.user_id = ?
    ORDER BY l.created_at ASC
  `).all(userId, userId);

  const createdCount = db.prepare('SELECT COUNT(*) as count FROM leagues WHERE creator_id = ?').get(userId).count;

  res.json({ leagues, createdCount, maxAllowed: 3 });
});

// 5. Obter jogos da jornada (adaptados ÃƒÆ’Ã‚Â  liga ativa)
router.get('/games', (req, res) => {
  const round = req.query.round ? parseInt(req.query.round) : 6;
  const userId = req.query.userId || '';
  const leagueId = req.query.leagueId || '';

  // Atualizar automaticamente jogos que já iniciaram
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE games 
    SET status = 'LIVE' 
    WHERE status = 'UPCOMING' AND kickoff_time <= ?
  `).run(now);

  const games = db.prepare(`
    SELECT 
      g.*,
      hc.name as home_name, hc.short_name as home_short, hc.primary_color as home_color, hc.accent_color as home_accent,
      ac.name as away_name, ac.short_name as away_short, ac.primary_color as away_color, ac.accent_color as away_accent,
      p.choice as user_prediction, p.points_won as user_points_won, p.net_points as user_net_points,
      (SELECT COUNT(*) FROM predictions WHERE game_id = g.id AND league_id = ?) as league_total_bets
    FROM games g
    JOIN clubs hc ON g.home_club_id = hc.id
    JOIN clubs ac ON g.away_club_id = ac.id
    LEFT JOIN predictions p ON p.game_id = g.id AND p.user_id = ? AND p.league_id = ?
    WHERE g.round = ?
    ORDER BY g.kickoff_time ASC
  `).all(leagueId, userId, leagueId, round);

  res.json(games);
});

// 6. Colocar / Alterar palpite (por liga)
router.post('/predictions', (req, res) => {
  const { userId, gameId, choice, leagueId } = req.body;
  if (!userId || !gameId || !choice || !leagueId) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) return res.status(404).json({ error: 'Jogo nÃƒÆ’Ã‚Â£o encontrado' });

  // Bloqueio rigoroso ao apito inicial
  if (game.status !== 'UPCOMING' || new Date(game.kickoff_time) <= new Date()) {
    return res.status(400).json({ error: 'O jogo jÃƒÆ’Ã‚Â¡ iniciou! As apostas fecharam ao apito inicial.' });
  }

  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND game_id = ? AND league_id = ?').get(userId, gameId, leagueId);
  
  if (existing) {
    db.prepare('UPDATE predictions SET choice = ?, created_at = ? WHERE id = ?').run(choice, now, existing.id);
  } else {
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT INTO predictions (id, user_id, game_id, league_id, choice, created_at, points_won, net_points)
      VALUES (?, ?, ?, ?, ?, ?, 0.00, 0.00)
    `).run(id, userId, gameId, leagueId, choice, now);
  }

  const pred = db.prepare('SELECT * FROM predictions WHERE user_id = ? AND game_id = ? AND league_id = ?').get(userId, gameId, leagueId);
  res.json({ success: true, prediction: pred });
});

// 7. RelatÃƒÆ’Ã‚Â³rio das 3 colunas (filtrado pela liga ativa)
router.get('/games/:id/report', (req, res) => {
  const gameId = req.params.id;
  const leagueId = req.query.leagueId;

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

  const isStarted = game.status === 'LIVE' || game.status === 'FINISHED' || new Date(game.kickoff_time) <= new Date();

  if (isStarted && game.status === 'UPCOMING') {
    db.prepare("UPDATE games SET status = 'LIVE' WHERE id = ?").run(gameId);
    game.status = 'LIVE';
  }

  // Buscar apenas palpites dos membros desta liga
  const bets = db.prepare(`
    SELECT p.*, u.name as user_name, u.avatar as user_avatar, u.favorite_club as user_club
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.game_id = ? AND p.league_id = ?
  `).all(gameId, leagueId);

  // Buscar todos os membros desta liga para apurar quem apostou e quem faltou
  const allMembers = leagueId ? db.prepare(`
    SELECT u.id, u.name, u.avatar, u.favorite_club
    FROM league_members lm
    JOIN users u ON lm.user_id = u.id
    WHERE lm.league_id = ?
  `).all(leagueId) : [];

  const validBets = bets.filter(b => b.choice !== 'MISSED');
  const bettorUserIds = new Set(validBets.map(b => b.user_id));
  const missingMembers = allMembers.filter(m => !bettorUserIds.has(m.id));

  const homeBets = validBets.filter(b => b.choice === 'HOME');
  const drawBets = validBets.filter(b => b.choice === 'DRAW');
  const awayBets = validBets.filter(b => b.choice === 'AWAY');
  const totalBets = validBets.length;
  const pool = totalBets * 1.00;

  if (!isStarted) {
    return res.json({
      game,
      isStarted: false,
      isLocked: false,
      totalBets,
      poolPoints: pool,
      columns: {
        home: { title: game.home_short, count: homeBets.length, bets: [] },
        draw: { title: 'EMPATE', count: drawBets.length, bets: [] },
        away: { title: game.away_short, count: awayBets.length, bets: [] }
      },
      missingMembers: []
    });
  }

  return res.json({
    game,
    isStarted: true,
    isLocked: true,
    totalBets,
    poolPoints: pool,
    columns: {
      home: { title: game.home_short, count: homeBets.length, bets: homeBets },
      draw: { title: 'EMPATE', count: drawBets.length, bets: drawBets },
      away: { title: game.away_short, count: awayBets.length, bets: awayBets }
    },
    missingMembers
  });
});

// 8. Rankings da Liga Ativa
router.get('/leaderboard/round/:round', (req, res) => {
  const round = parseInt(req.params.round);
  const leagueId = req.query.leagueId;

  const roundResults = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar, u.favorite_club,
      COALESCE(ROUND(SUM(p.net_points), 2), 0.00) as round_points,
      COUNT(CASE WHEN p.net_points > 0 THEN 1 END) as round_wins,
      COUNT(p.id) as round_bets
    FROM league_members lm
    JOIN users u ON lm.user_id = u.id
    LEFT JOIN predictions p ON p.user_id = u.id AND p.league_id = ?
    LEFT JOIN games g ON p.game_id = g.id AND g.round = ? AND g.status = 'FINISHED'
    WHERE lm.league_id = ?
    GROUP BY u.id
    ORDER BY round_points DESC, round_wins DESC
  `).all(leagueId, round, leagueId);

  res.json({ round, leaderboard: roundResults });
});

router.get('/leaderboard/general', (req, res) => {
  const leagueId = req.query.leagueId;

  const leaders = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar, u.favorite_club, lm.balance,
      COUNT(p.id) as total_bets,
      COUNT(CASE WHEN p.net_points > 0 THEN 1 END) as wins,
      CASE 
        WHEN COUNT(p.id) > 0 THEN ROUND((COUNT(CASE WHEN p.net_points > 0 THEN 1 END) * 100.0) / COUNT(p.id), 1)
        ELSE 0.0
      END as efficiency_pct
    FROM league_members lm
    JOIN users u ON lm.user_id = u.id
    LEFT JOIN predictions p ON p.user_id = u.id AND p.league_id = ? AND p.net_points != 0
    WHERE lm.league_id = ?
    GROUP BY u.id
    ORDER BY lm.balance DESC, efficiency_pct DESC
  `).all(leagueId, leagueId);

  res.json(leaders);
});

// 9. Atualizar clube
router.post('/users/update-club', (req, res) => {
  const { userId, clubId } = req.body;
  if (!userId || !clubId) return res.status(400).json({ error: 'ParÃƒÆ’Ã‚Â¢metros em falta' });
  const clubAvatars = { SCP: 'ÃƒÂ°Ã…Â¸Ã‚Â¦Ã‚Â', SLB: 'ÃƒÂ°Ã…Â¸Ã‚Â¦Ã¢â‚¬Â¦', FCP: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ¢â‚¬Â°', SCB: 'ÃƒÂ¢Ã…Â¡Ã¢â‚¬ÂÃƒÂ¯Ã‚Â¸Ã‚Â', VSC: 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â¡ÃƒÂ¯Ã‚Â¸Ã‚Â', GOLD: 'ÃƒÂ¢Ã…Â¡Ã‚Â¡' };
  const avatar = clubAvatars[clubId] || 'ÃƒÂ¢Ã…Â¡Ã‚Â½';
  db.prepare('UPDATE users SET favorite_club = ?, avatar = ? WHERE id = ?').run(clubId, avatar, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json(user);
});

// 10. Sincronizar API de futebol
router.post('/admin/sync-api', async (req, res) => {
  const matchday = req.body.matchday ? parseInt(req.body.matchday) : 6;
  const result = await FootballApiService.syncMatchday(matchday);
  res.json(result);
});
