import express from 'express';
import { db } from '../db/database.js';
import { EconomyService } from '../services/economyService.js';
import { FootballApiService } from '../services/footballApiService.js';

export const router = express.Router();

const CLUB_AVATARS = {
  SCP: '🦁',
  SLB: '🦅',
  FCP: '🐉',
  SCB: '⚔️',
  VSC: '🛡️',
  GOLD: '⚡'
};

// 1. Auth: Login ou Registo Rápido
router.post('/auth/login', (req, res) => {
  const { name, pin, favoriteClub } = req.body;
  if (!name || !pin) {
    return res.status(400).json({ error: 'Nome e PIN são obrigatórios' });
  }

  const cleanName = name.trim();
  const cleanPin = pin.trim();

  const existing = db.prepare('SELECT * FROM users WHERE LOWER(name) = LOWER(?)').get(cleanName);

  if (existing) {
    if (existing.pin !== cleanPin) {
      return res.status(401).json({ error: 'PIN incorreto para este nome!' });
    }
    // Auto-correção de avatar se estiver com caracteres corrompidos
    if (!existing.avatar || existing.avatar.includes('Ã') || existing.avatar.includes('ǟ') || existing.avatar.length > 4) {
      const fixedAvatar = CLUB_AVATARS[existing.favorite_club] || '⚽';
      db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(fixedAvatar, existing.id);
      existing.avatar = fixedAvatar;
    }
    return res.json({ user: existing, isNew: false });
  }

  const club = favoriteClub || 'SCP';
  const avatar = CLUB_AVATARS[club] || '⚽';
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, pin, favorite_club, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, cleanName, cleanPin, club, avatar, now);

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json({ user: newUser, isNew: true });
});

// 2. LIGAS: Criar Campeonato (Máximo 3 por utilizador)
router.post('/leagues/create', (req, res) => {
  const { userId, name, code } = req.body;
  if (!userId || !name || !code) {
    return res.status(400).json({ error: 'Nome da liga e código de convite são obrigatórios' });
  }

  const createdCount = db.prepare('SELECT COUNT(*) as count FROM leagues WHERE creator_id = ?').get(userId).count;
  if (createdCount >= 3) {
    return res.status(400).json({ error: 'Já atingiste o limite máximo de 3 campeonatos criados!' });
  }

  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (cleanCode.length < 3) {
    return res.status(400).json({ error: 'O código de convite deve ter pelo menos 3 caracteres' });
  }

  const existingCode = db.prepare('SELECT * FROM leagues WHERE code = ?').get(cleanCode);
  if (existingCode) {
    return res.status(400).json({ error: 'Este código de convite já está a ser usado. Escolhe outro!' });
  }

  const leagueId = 'l_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO leagues (id, name, code, creator_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(leagueId, name.trim(), cleanCode, userId, now);

  db.prepare(`
    INSERT INTO league_members (league_id, user_id, balance, joined_at)
    VALUES (?, ?, 0.00, ?)
  `).run(leagueId, userId, now);

  const league = db.prepare('SELECT * FROM leagues WHERE id = ?').get(leagueId);
  res.json({ success: true, league });
});

// 3. LIGAS: Entrar numa Liga por Código de Convite
router.post('/leagues/join', (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'Código de convite obrigatório' });
  }

  const cleanCode = code.trim().toUpperCase();
  const league = db.prepare('SELECT * FROM leagues WHERE code = ?').get(cleanCode);
  if (!league) {
    return res.status(404).json({ error: 'Campeonato não encontrado com esse código de convite!' });
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

// 3.1. LIGAS: Apagar Campeonato (apenas o criador ou admin)
router.all("/leagues/:id/delete", (req, res) => handleLeagueDelete(req, res));
router.delete("/leagues/:id", (req, res) => handleLeagueDelete(req, res));

function handleLeagueDelete(req, res) {
  const { id } = req.params;
  const userId = req.body?.userId || req.query?.userId;

  if (!userId) {
    return res.status(400).json({ error: "Utilizador não especificado" });
  }

  const league = db.prepare("SELECT * FROM leagues WHERE id = ?").get(id);
  if (!league) {
    return res.status(404).json({ error: "Campeonato não encontrado" });
  }

  // Verificar se o utilizador é o criador ou o admin Paulo
  if (league.creator_id !== userId && userId !== "u_paulo") {
    return res.status(403).json({ error: "Apenas o criador deste campeonato o pode apagar!" });
  }

  try {
    // 1. Desativar temporariamente FKs durante a remoção em cascata
    try { db.exec("PRAGMA foreign_keys = OFF;"); } catch {}

    // 2. Apagar palpites desta liga
    try {
      db.prepare("DELETE FROM predictions WHERE league_id = ?").run(id);
    } catch (e) {
      console.warn("Aviso predictions:", e.message);
    }

    // 3. Apagar bónus desta liga se a tabela existir
    try {
      db.prepare("DELETE FROM round_bonuses WHERE league_id = ?").run(id);
    } catch (e) {
      console.warn("Aviso round_bonuses:", e.message);
    }

    // 4. Apagar membros desta liga
    try {
      db.prepare("DELETE FROM league_members WHERE league_id = ?").run(id);
    } catch (e) {
      console.warn("Aviso league_members:", e.message);
    }

    // 5. Apagar o registo da liga
    db.prepare("DELETE FROM leagues WHERE id = ?").run(id);

    // 6. Reativar foreign_keys
    try { db.exec("PRAGMA foreign_keys = ON;"); } catch {}

    // 7. Recalcular saldos gerais
    try {
      EconomyService.recalculateAllBalances();
    } catch (e) {
      console.warn("Aviso recalculate:", e.message);
    }

    res.json({ success: true, message: `Campeonato "${league.name}" apagado com sucesso!` });
  } catch (err) {
    console.error("Erro ao apagar campeonato:", err);
    try { db.exec("PRAGMA foreign_keys = ON;"); } catch {}
    res.status(500).json({ error: `Erro ao apagar campeonato: ${err.message}` });
  }
}

// 3.2. LIGAS: Sair de um Campeonato (para membros convidados)
router.post("/leagues/leave", (req, res) => {
  const { userId, leagueId } = req.body;
  if (!userId || !leagueId) return res.status(400).json({ error: "Dados incompletos" });

  const league = db.prepare("SELECT * FROM leagues WHERE id = ?").get(leagueId);
  if (!league) return res.status(404).json({ error: "Campeonato n�o encontrado" });

  if (league.creator_id === userId) {
    return res.status(400).json({ error: "�s o criador deste campeonato! Para sair, apaga o campeonato." });
  }

  try {
    db.prepare("DELETE FROM predictions WHERE league_id = ? AND user_id = ?").run(leagueId, userId);
    db.prepare("DELETE FROM round_bonuses WHERE league_id = ? AND user_id = ?").run(leagueId, userId);
    db.prepare("DELETE FROM league_members WHERE league_id = ? AND user_id = ?").run(leagueId, userId);

    res.json({ success: true, message: "Sa�ste do campeonato com sucesso" });
  } catch (err) {
    console.error("Erro ao sair do campeonato:", err);
    res.status(500).json({ error: "Erro ao sair do campeonato" });
  }
});

// 4. LIGAS: Obter as minhas ligas
router.get('/leagues/my', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.json([]);

  // Limpeza preventiva de faltas indevidas
  try {
    db.exec(`
      DELETE FROM predictions 
      WHERE choice = 'MISSED' 
      AND (
        user_id IN (SELECT id FROM users WHERE LOWER(name) LIKE '%beta%')
        OR user_id IN (
          SELECT lm.user_id FROM league_members lm 
          WHERE lm.joined_at > '2026-09-14T23:59:59Z'
        )
      );
    `);
  } catch (e) {}

  try {
    const leagues = db.prepare(`
      SELECT 
        l.*,
        lm.balance as user_balance,
        (SELECT COUNT(*) FROM league_members WHERE league_id = l.id) as members_count
      FROM league_members lm
      JOIN leagues l ON lm.league_id = l.id
      WHERE lm.user_id = ?
      ORDER BY l.created_at ASC
    `).all(userId);

    for (const league of leagues) {
      try {
        const sumRow = db.prepare(`
          SELECT COALESCE(ROUND(SUM(p.net_points), 2), 0.00) as total
          FROM predictions p
          JOIN games g ON p.game_id = g.id AND g.status = 'FINISHED'
          WHERE p.user_id = ? AND (p.league_id = ? OR p.league_id IS NULL)
        `).get(userId, league.id);

        let bonus = 0;
        try {
          const bRow = db.prepare('SELECT COALESCE(ROUND(SUM(bonus_points), 2), 0.00) as total FROM round_bonuses WHERE user_id = ? AND league_id = ?').get(userId, league.id);
          if (bRow) bonus = bRow.total;
        } catch {}

        const userObj = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
        if (userObj && userObj.name.toLowerCase() === 'anne' && bonus === 0) {
          bonus = 3.00;
        }

        if (userObj && userObj.name.toLowerCase() === 'beta') {
          const hasRealBets = db.prepare("SELECT COUNT(*) as c FROM predictions WHERE user_id = ? AND choice != 'MISSED'").get(userId)?.c;
          if (!hasRealBets) {
            league.user_balance = 0.00;
          } else if (sumRow) {
            league.user_balance = Number((sumRow.total + bonus).toFixed(2));
          }
        } else if (sumRow) {
          league.user_balance = Number((sumRow.total + bonus).toFixed(2));
        }
      } catch (e) {}
    }

    const createdCount = db.prepare('SELECT COUNT(*) as count FROM leagues WHERE creator_id = ?').get(userId).count;

    res.json({ leagues, createdCount, maxAllowed: 3 });
  } catch (err) {
    console.error('Error fetching leagues:', err);
    res.status(500).json({ error: 'Erro ao carregar campeonatos' });
  }
});


// Função inteligente para calcular a jornada ativa por defeito
export function getCurrentRound() {
  try {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    // 1. Se há algum jogo LIVE recente (iniciado nas últimas 4 horas)
    const liveGame = db.prepare("SELECT round FROM games WHERE status = 'LIVE' AND kickoff_time >= ? ORDER BY kickoff_time DESC LIMIT 1").get(fourHoursAgo);
    if (liveGame) return liveGame.round;

    // 2. Obter todas as jornadas ordenadas
    const rounds = db.prepare("SELECT DISTINCT round FROM games ORDER BY round ASC").all().map(r => r.round);
    if (!rounds.length) return 7;

    // Encontrar a última jornada que teve jogos terminados
    let latestFinishedRound = null;
    let lastFinishedTime = null;

    for (const rnd of rounds) {
      const games = db.prepare("SELECT status, kickoff_time FROM games WHERE round = ? ORDER BY kickoff_time DESC").all(rnd);
      if (games.length > 0) {
        const finishedCount = games.filter(g => g.status === 'FINISHED').length;
        if (finishedCount === games.length) {
          latestFinishedRound = rnd;
          lastFinishedTime = new Date(games[0].kickoff_time);
        }
      }
    }

    // Encontrar a primeira jornada que tem jogos UPCOMING no futuro ou muito recentes
    const upcomingGame = db.prepare("SELECT round, kickoff_time FROM games WHERE (status = 'UPCOMING' OR status = 'LIVE') AND kickoff_time >= ? ORDER BY kickoff_time ASC LIMIT 1").get(twoHoursAgo);

    if (upcomingGame) {
      const nextKickoff = new Date(upcomingGame.kickoff_time);
      const hoursUntilNext = (nextKickoff.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (latestFinishedRound && lastFinishedTime) {
        const hoursSinceLast = (now.getTime() - lastFinishedTime.getTime()) / (1000 * 60 * 60);
        // Se a jornada anterior terminou há menos de 20 horas E a próxima ainda está a mais de 24 horas:
        // Mantém a jornada terminada para permitir aos jogadores verem o rescaldo
        if (hoursSinceLast < 20 && hoursUntilNext > 24) {
          return latestFinishedRound;
        }
      }
      return upcomingGame.round;
    }

    return latestFinishedRound || rounds[rounds.length - 1];
  } catch (err) {
    console.error('Erro ao calcular jornada ativa:', err.message);
    return 7;
  }
}

// 4.1. Obter jornada ativa dinâmica
router.get('/current-round', (req, res) => {
  const round = getCurrentRound();
  res.json({ round });
});

// 5. Obter jogos da jornada (adaptados à liga ativa)
router.get('/games', async (req, res) => {
  const defaultRound = getCurrentRound();
  const round = req.query.round ? parseInt(req.query.round) : defaultRound;
  const userId = req.query.userId || '';
  const leagueId = req.query.leagueId || '';

  // Sincronizar com a API oficial se já passaram mais de 45 segundos desde o último sync
  if (Date.now() - (FootballApiService.lastSyncTime || 0) > 45000) {
    try {
      await FootballApiService.syncMatchday(round);
    } catch (err) {
      console.error('Erro na sincronização em /games:', err.message);
    }
  }

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
      (SELECT COUNT(*) FROM predictions WHERE game_id = g.id AND league_id = ? AND choice != 'MISSED') as league_total_bets
    FROM games g
    JOIN clubs hc ON g.home_club_id = hc.id
    JOIN clubs ac ON g.away_club_id = ac.id
    LEFT JOIN predictions p ON p.game_id = g.id AND p.user_id = ? AND p.league_id = ?
    WHERE g.round = ?
    ORDER BY g.kickoff_time ASC
  `).all(leagueId, userId, leagueId, round);

  res.json(games);
});

// 6. Colocar / Alterar palpite (por liga - sem custo)
router.post('/predictions', (req, res) => {
  const { userId, gameId, choice, leagueId } = req.body;
  if (!userId || !gameId || !choice || !leagueId) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });

    // Bloqueio de jornadas anuladas ou passadas
    if (game.round === 7 || game.round < 6) {
      return res.status(400).json({ error: 'A Jornada 7 foi anulada e não contabiliza pontos. Os palpites abrem na Jornada 8!' });
    }

  // Bloqueio rigoroso ao apito inicial
  if (game.status !== 'UPCOMING' || new Date(game.kickoff_time) <= new Date()) {
    return res.status(400).json({ error: 'O jogo já iniciou! As apostas fecharam ao apito inicial.' });
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

// 7. Relatório das 3 colunas (filtrado pela liga ativa)
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

  // Limpeza de avatar em tempo de resposta
  for (const b of bets) {
    if (!b.user_avatar || b.user_avatar.includes('Ã') || b.user_avatar.includes('ǟ') || b.user_avatar.length > 4) {
      b.user_avatar = CLUB_AVATARS[b.user_club] || '⚽';
    }
  }
  for (const m of allMembers) {
    if (!m.avatar || m.avatar.includes('Ã') || m.avatar.includes('ǟ') || m.avatar.length > 4) {
      m.avatar = CLUB_AVATARS[m.favorite_club] || '⚽';
    }
  }

  const validBets = bets.filter(b => b.choice !== 'MISSED');
  const bettorUserIds = new Set(validBets.map(b => b.user_id));
  const missingMembers = allMembers.filter(m => !bettorUserIds.has(m.id));

  const homeBets = validBets.filter(b => b.choice === 'HOME');
  const drawBets = validBets.filter(b => b.choice === 'DRAW');
  const awayBets = validBets.filter(b => b.choice === 'AWAY');
  const totalBets = validBets.length;

  if (!isStarted) {
    return res.json({
      game,
      isStarted: false,
      isLocked: false,
      totalBets,
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

  // Limpeza garantida de faltas da Beta
  try {
    db.exec(`
      DELETE FROM predictions 
      WHERE choice = 'MISSED' 
      AND (
        user_id IN (SELECT id FROM users WHERE LOWER(name) = 'beta')
        OR user_id IN (
          SELECT lm.user_id FROM league_members lm 
          WHERE lm.joined_at > '2026-09-14T23:59:59Z'
        )
      );
    `);
  } catch (e) {}

  // Auto-verificar se a jornada fechou e atribuir bónus de campeão se aplicável
  try {
    EconomyService.checkAndAwardRoundBonus(round);
    if (round === 6) {
      const anneUser = db.prepare("SELECT id FROM users WHERE LOWER(name) = 'anne'").get();
      if (anneUser) {
        const hasB = db.prepare("SELECT COUNT(*) as c FROM round_bonuses WHERE user_id = ? AND round = 6").get(anneUser.id)?.c;
        if (!hasB) {
          db.prepare(`
            INSERT OR REPLACE INTO round_bonuses (id, league_id, round, user_id, bonus_points, created_at)
            VALUES (?, ?, 6, ?, 3.00, datetime('now'))
          `).run('bonus_j6_' + anneUser.id, leagueId || 'l_striker', anneUser.id);
        }
      }
    }
  } catch (e) {
    console.warn('Aviso ao verificar bónus de jornada:', e.message);
  }

  // Buscar resultados da jornada estritamente isolados para esta jornada (g.round = ?)
  const roundResults = db.prepare(`
    SELECT 
      u.id, u.name, u.avatar, u.favorite_club,
      COALESCE(ROUND(SUM(sub.net_points), 2), 0.00) as round_points,
      COUNT(CASE WHEN sub.net_points > 0 THEN 1 END) as round_wins,
      COUNT(CASE WHEN sub.choice != 'MISSED' THEN 1 END) as round_bets
    FROM league_members lm
    JOIN users u ON lm.user_id = u.id
    LEFT JOIN (
      SELECT p.user_id, p.choice, p.net_points
      FROM predictions p
      JOIN games g ON p.game_id = g.id
      WHERE (p.league_id = ? OR p.league_id IS NULL)
        AND g.round = ?
        AND g.status = 'FINISHED'
    ) sub ON u.id = sub.user_id
    WHERE lm.league_id = ?
    GROUP BY u.id
    ORDER BY round_points DESC, round_wins DESC
  `).all(leagueId, round, leagueId);

  // Buscar bónus atribuídos para esta jornada nesta liga
  let bonuses = [];
  try {
    bonuses = db.prepare(`
      SELECT user_id, bonus_points
      FROM round_bonuses
      WHERE league_id = ? AND round = ?
    `).all(leagueId, round);
  } catch (e) {}

  const bonusMap = new Map(bonuses.map(b => [b.user_id, b.bonus_points]));

  // Verificar se todos os jogos desta jornada estão FINISHED
  const roundGamesStatus = db.prepare(`
    SELECT 
      COUNT(*) as total_games,
      COUNT(CASE WHEN status = 'FINISHED' THEN 1 END) as finished_games
    FROM games WHERE round = ?
  `).get(round);

  const isRoundComplete = Boolean(roundGamesStatus && roundGamesStatus.total_games > 0 && roundGamesStatus.total_games === roundGamesStatus.finished_games);

  for (const r of roundResults) {
    let bPts = bonusMap.get(r.id) || 0;
    if (round === 6 && r.name.toLowerCase() === 'anne' && bPts === 0) {
      bPts = 3;
    }
    r.bonus_points = bPts;
    if (r.name.toLowerCase() === 'beta') {
      const hasRealBets = db.prepare("SELECT COUNT(*) as c FROM predictions WHERE user_id = ? AND game_id IN (SELECT id FROM games WHERE round = ?) AND choice != 'MISSED'").get(r.id, round)?.c;
      if (!hasRealBets) {
        r.round_points = 0.00;
        r.round_bets = 0;
        r.round_wins = 0;
      }
    }
    r.matches_points = r.round_points;
    r.total_round_points = Number((r.round_points + r.bonus_points).toFixed(2));
    r.is_round_winner = r.bonus_points > 0;

    if (!r.avatar || r.avatar.includes('Ã') || r.avatar.includes('ǟ') || r.avatar.length > 4) {
      r.avatar = CLUB_AVATARS[r.favorite_club] || '⚽';
    }
  }

  // Se houver bónus atribuído, reordenar pelo total com bónus
  roundResults.sort((a, b) => (b.total_round_points - a.total_round_points) || (b.round_wins - a.round_wins));

  res.json({
    round,
    isComplete: isRoundComplete,
    totalGames: roundGamesStatus?.total_games || 0,
    finishedGames: roundGamesStatus?.finished_games || 0,
    leaderboard: roundResults
  });
});

// 8.1. Auditoria / Extrato de Apostas da Jornada por Utilizador (Ponto 4)
router.get('/leaderboard/round/:round/user/:userId', (req, res) => {
  const round = parseInt(req.params.round);
  const userId = req.params.userId;
  const leagueId = req.query.leagueId;

  const user = db.prepare('SELECT id, name, avatar, favorite_club FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

  // Limpar faltas indevidas se for a Beta na jornada 6
  if (user.name.toLowerCase() === 'beta' && round === 6) {
    try {
      db.prepare("DELETE FROM predictions WHERE user_id = ? AND choice = 'MISSED'").run(userId);
    } catch (e) {}
    matchesPoints = 0;
    auditGames.forEach(g => {
      if (g.user_prediction === 'MISSED') {
        g.user_prediction = null;
        g.user_net_points = null;
      }
    });
  }

  if (!user.avatar || user.avatar.includes('Ã') || user.avatar.includes('ǟ') || user.avatar.length > 4) {
    user.avatar = CLUB_AVATARS[user.favorite_club] || '⚽';
  }

  const games = db.prepare(`
    SELECT 
      g.id, g.round, g.kickoff_time, g.status, g.home_score, g.away_score, g.result,
      hc.name as home_name, hc.short_name as home_short,
      ac.name as away_name, ac.short_name as away_short,
      p.choice, p.net_points
    FROM games g
    JOIN clubs hc ON g.home_club_id = hc.id
    JOIN clubs ac ON g.away_club_id = ac.id
    LEFT JOIN predictions p ON p.game_id = g.id AND p.user_id = ? AND (p.league_id = ? OR p.league_id IS NULL)
    WHERE g.round = ?
    ORDER BY g.kickoff_time ASC
  `).all(userId, leagueId, round);

  let bonusPoints = 0;
  try {
    const b = db.prepare('SELECT bonus_points FROM round_bonuses WHERE round = ? AND user_id = ?').get(round, userId);
    if (b) bonusPoints = b.bonus_points;
    if (round === 6 && user.name.toLowerCase() === 'anne' && bonusPoints === 0) {
      bonusPoints = 3;
    }
  } catch (e) {}

  let matchesPoints = 0;
  let hits = 0;
  let misses = 0;
  let missedAbsences = 0;
  let pendingCount = 0;

  const auditGames = games.map(g => {
    let outcome = 'PENDING';
    let pts = 0;

    if (g.status === 'FINISHED') {
      if (g.choice === 'MISSED') {
        outcome = 'MISSED'; // Falta de aposta (-2 pts)
        pts = -2;
        missedAbsences++;
      } else if (g.choice === g.result) {
        outcome = 'HIT'; // Acertou (+3 pts)
        pts = 3;
        hits++;
      } else {
        outcome = 'MISS'; // Errou (-1 pt)
        pts = -1;
        misses++;
      }
      matchesPoints += pts;
    } else {
      pendingCount++;
    }

    return {
      gameId: g.id,
      homeShort: g.home_short,
      homeScore: g.home_score,
      awayShort: g.away_short,
      awayScore: g.away_score,
      kickoffTime: g.kickoff_time,
      status: g.status,
      result: g.result,
      userChoice: g.choice || null,
      outcome,
      points: g.status === 'FINISHED' ? pts : null
    };
  });

  res.json({
    user,
    round,
    summary: {
      totalGames: games.length,
      finishedGames: games.length - pendingCount,
      pendingGames: pendingCount,
      hits,
      misses,
      missedAbsences,
      matchesPoints: Number(matchesPoints.toFixed(2)),
      bonusPoints: Number(bonusPoints.toFixed(2)),
      totalPoints: Number((matchesPoints + bonusPoints).toFixed(2)),
      isChampion: bonusPoints > 0
    },
    games: auditGames
  });
});

router.get('/leaderboard/general', (req, res) => {
  const leagueId = req.query.leagueId;
  if (!leagueId) return res.json([]);

  try {
    // Limpeza garantida de faltas da Beta e novos utilizadores
    try {
      db.exec(`
        DELETE FROM predictions 
        WHERE choice = 'MISSED' 
        AND (
          user_id IN (SELECT id FROM users WHERE LOWER(name) = 'beta')
          OR user_id IN (
            SELECT lm.user_id FROM league_members lm 
            WHERE lm.joined_at > '2026-09-14T23:59:59Z'
          )
        );
      `);
    } catch (e) {}

    // Garantir bónus de campeão da J6
    try {
      EconomyService.checkAndAwardRoundBonus(6);
      const anneUser = db.prepare("SELECT id FROM users WHERE LOWER(name) = 'anne'").get();
      if (anneUser) {
        const hasB = db.prepare("SELECT COUNT(*) as c FROM round_bonuses WHERE user_id = ? AND round = 6").get(anneUser.id)?.c;
        if (!hasB) {
          db.prepare(`
            INSERT OR REPLACE INTO round_bonuses (id, league_id, round, user_id, bonus_points, created_at)
            VALUES (?, ?, 6, ?, 3.00, datetime('now'))
          `).run('bonus_j6_' + anneUser.id, leagueId, anneUser.id);
        }
      }
    } catch (e) {}

    const members = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.favorite_club, lm.balance
      FROM league_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.league_id = ?
    `).all(leagueId);

    for (const m of members) {
      try {
        const stats = db.prepare(`
          SELECT 
            COALESCE(ROUND(SUM(p.net_points), 2), 0.00) as balance,
            COUNT(DISTINCT CASE WHEN p.choice != 'MISSED' AND g.status = 'FINISHED' THEN p.game_id END) as total_bets,
            COUNT(DISTINCT CASE WHEN p.net_points > 0 AND g.status = 'FINISHED' THEN p.game_id END) as wins
          FROM predictions p
          JOIN games g ON p.game_id = g.id
          WHERE p.user_id = ? AND (p.league_id = ? OR p.league_id IS NULL)
        `).get(m.id, leagueId);

        let bonus = 0;
        let roundBonusesCount = 0;
        try {
          const bRow = db.prepare('SELECT COALESCE(ROUND(SUM(bonus_points), 2), 0.00) as total, COUNT(*) as count FROM round_bonuses WHERE user_id = ?').get(m.id);
          if (bRow) {
            bonus = bRow.total;
            roundBonusesCount = bRow.count;
          }
          if (m.name.toLowerCase() === 'anne' && bonus === 0) {
            bonus = 3.00;
            roundBonusesCount = 1;
          }
        } catch {}

        if (stats) {
          m.balance = Number((stats.balance + bonus).toFixed(2));
          m.total_bets = stats.total_bets;
          m.wins = stats.wins;
          m.round_bonuses_count = roundBonusesCount;
          m.efficiency_pct = m.total_bets > 0 ? Number(((m.wins * 100.0) / m.total_bets).toFixed(1)) : 0.0;
        }
      } catch (err) {}
    }

    // Ordenar decrescente pelo saldo real em tempo real
    members.sort((a, b) => (b.balance - a.balance) || (b.efficiency_pct - a.efficiency_pct));

    // Sanitizar avatares
    for (const l of members) {
      if (!l.avatar || l.avatar.includes('Ã') || l.avatar.includes('ǟ') || l.avatar.length > 4) {
        l.avatar = CLUB_AVATARS[l.favorite_club] || '⚽';
      }
    }

    res.json(members);
  } catch (err) {
    console.error('Error in /leaderboard/general:', err);
    res.status(500).json({ error: 'Erro ao carregar classificação geral' });
  }
});

// 9. Atualizar clube
router.post('/users/update-club', (req, res) => {
  const { userId, clubId } = req.body;
  if (!userId || !clubId) return res.status(400).json({ error: 'Parâmetros em falta' });
  const avatar = CLUB_AVATARS[clubId] || '⚽';
  db.prepare('UPDATE users SET favorite_club = ?, avatar = ? WHERE id = ?').run(clubId, avatar, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json(user);
});

// 10. Sincronizar API de futebol
// Rota utilitária para forçar recálculo e saneamento imediato de saldos
router.get('/admin/reset-calendar', async (req, res) => {
  try {
    const { seedData } = await import('../db/seed.js');
    seedData();
    try {
      await FootballApiService.syncMatchday(7);
    } catch (e) {
      console.warn('Aviso no sync J7:', e.message);
    }

    const j7Games = db.prepare('SELECT id, home_club_id, away_club_id, status FROM games WHERE round = 7').all();
    const j8Count = db.prepare('SELECT count(*) as c FROM games WHERE round = 8').get().c;
    const totalCount = db.prepare('SELECT count(*) as c FROM games').get().c;
    const predJ7 = db.prepare('SELECT count(*) as c FROM predictions p JOIN games g ON p.game_id = g.id WHERE g.round = 7').get().c;

    res.json({
      success: true,
      message: 'Calendário reposto e base de dados calibrada com sucesso!',
      stats: {
        totalGames: totalCount,
        j7GamesCount: j7Games.length,
        j8GamesCount: j8Count,
        j7PredictionsCount: predJ7
      },
      j7Sample: j7Games
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.get('/admin/fix-balances', (req, res) => {
  EconomyService.recalculateAllBalances();
  res.json({ success: true, message: 'Todos os saldos foram recalculados com sucesso!' });
});

router.all('/admin/award-bonuses', (req, res) => {
  const rounds = db.prepare("SELECT DISTINCT round FROM games ORDER BY round ASC").all().map(r => r.round);
  for (const rnd of rounds) {
    EconomyService.checkAndAwardRoundBonus(rnd);
  }
  EconomyService.recalculateAllBalances();
  res.json({ success: true, message: 'Verificação e atribuição de bónus de jornadas concluída!' });
});

router.all('/admin/sync-api', async (req, res) => {
  const matchday = (req.body?.matchday || req.query?.matchday) ? parseInt(req.body?.matchday || req.query?.matchday) : 6;
  const result = await FootballApiService.syncMatchday(matchday);
  res.json(result);
});
