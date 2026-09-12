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

  // Recalcular saldos de uma liga de forma determinística e blindada a duplicados
  recalculateLeagueBalances(leagueId) {
    const members = db.prepare('SELECT user_id FROM league_members WHERE league_id = ?').all(leagueId);
    for (const m of members) {
      // Agrupar por game_id garante que cada jogo FINISHED só conta rigorosamente 1 única vez
      const predSum = db.prepare(`
        SELECT COALESCE(ROUND(SUM(sub.net_points), 2), 0.00) as total
        FROM (
          SELECT p.net_points
          FROM predictions p
          JOIN games g ON p.game_id = g.id
          WHERE p.user_id = ? 
            AND (p.league_id = ? OR p.league_id IS NULL)
            AND g.status = 'FINISHED'
          GROUP BY p.game_id
        ) sub
      `).get(m.user_id, leagueId).total;

      let bonusSum = 0;
      try {
        const row = db.prepare(`
          SELECT COALESCE(ROUND(SUM(sub_bonus.bonus_points), 2), 0.00) as total
          FROM (
            SELECT bonus_points
            FROM round_bonuses
            WHERE user_id = ? AND league_id = ?
            GROUP BY round
          ) sub_bonus
        `).get(m.user_id, leagueId);
        bonusSum = row ? row.total : 0;
      } catch (err) {
        bonusSum = 0;
      }

      const newBalance = Number((predSum + bonusSum).toFixed(2));
      db.prepare(`
        UPDATE league_members 
        SET balance = ? 
        WHERE league_id = ? AND user_id = ?
      `).run(newBalance, leagueId, m.user_id);
    }
  },

  // Recalcular saldos de todas as ligas
  recalculateAllBalances() {
    const leagues = db.prepare('SELECT id FROM leagues').all();
    for (const l of leagues) {
      this.recalculateLeagueBalances(l.id);
    }
  },

  // Finalizar jogo e processar regras oficiais (IDEMPOTENTE):
  // Acerto: +3 pts | Erro: -1 pt | Não apostou: -2 pts
  // Jornada fechada: Vencedor(es) da jornada recebem +3 pts extra de bónus!
  settleGame(gameId, homeScore, awayScore) {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
    if (!game) return { error: 'Jogo não encontrado' };

    // Se o jogo já estava terminado com este mesmo resultado, não reprocessar!
    if (game.status === 'FINISHED' && game.home_score === homeScore && game.away_score === awayScore) {
      return game;
    }

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

    // 2. Processar previsões em cada liga
    for (const { id: leagueId } of allLeagues) {
      const bets = db.prepare(`
        SELECT * FROM predictions WHERE game_id = ? AND (league_id = ? OR league_id IS NULL) AND choice != 'MISSED'
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
      }

      // Perdedores da Liga (-1 ponto fixo)
      for (const loser of losers) {
        db.prepare(`
          UPDATE predictions 
          SET points_won = 0.00, net_points = -1.00 
          WHERE id = ?
        `).run(loser.id);
      }

      // Membros da Liga que NÃO apostaram (-2 pontos por falta de aposta)
      const allMembers = db.prepare('SELECT user_id FROM league_members WHERE league_id = ?').all(leagueId);
      const bettorIds = new Set(bets.map(b => b.user_id));

      for (const member of allMembers) {
        if (!bettorIds.has(member.user_id)) {
          const existingMissed = db.prepare(`
            SELECT id FROM predictions WHERE game_id = ? AND (league_id = ? OR league_id IS NULL) AND user_id = ?
          `).get(gameId, leagueId, member.user_id);

          if (!existingMissed) {
            const missedId = 'missed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            db.prepare(`
              INSERT INTO predictions (id, user_id, game_id, league_id, choice, created_at, points_won, net_points)
              VALUES (?, ?, ?, ?, 'MISSED', ?, 0.00, -2.00)
            `).run(missedId, member.user_id, gameId, leagueId, now);
          }
        }
      }

      // Recalcular o saldo real e absoluto de todos os membros desta liga
      this.recalculateLeagueBalances(leagueId);
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
    const pendingGames = db.prepare(`
      SELECT COUNT(*) as count FROM games WHERE round = ? AND status != 'FINISHED'
    `).get(round).count;

    if (pendingGames > 0) {
      return;
    }

    console.log(`🏆 Jornada ${round} 100% concluída! A verificar campeões de jornada...`);
    const allLeagues = db.prepare('SELECT id FROM leagues').all();
    const now = new Date().toISOString();

    for (const { id: leagueId } of allLeagues) {
      const alreadyAwarded = db.prepare(`
        SELECT COUNT(*) as count FROM round_bonuses WHERE league_id = ? AND round = ?
      `).get(leagueId, round).count;

      if (alreadyAwarded > 0) {
        continue;
      }

      const roundScores = db.prepare(`
        SELECT 
          lm.user_id,
          COALESCE(ROUND(SUM(sub.net_points), 2), 0.00) as round_points
        FROM league_members lm
        LEFT JOIN (
          SELECT p.user_id, p.net_points
          FROM predictions p
          JOIN games g ON p.game_id = g.id AND g.round = ? AND g.status = 'FINISHED'
          WHERE p.league_id = ? OR p.league_id IS NULL
          GROUP BY p.user_id, p.game_id
        ) sub ON lm.user_id = sub.user_id
        WHERE lm.league_id = ?
        GROUP BY lm.user_id
        ORDER BY round_points DESC
      `).all(round, leagueId, leagueId);

      if (roundScores.length === 0) continue;

      const bestScore = roundScores[0].round_points;
      const winners = roundScores.filter(s => s.round_points === bestScore);

      for (const winner of winners) {
        const bonusId = 'bonus_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        db.prepare(`
          INSERT INTO round_bonuses (id, league_id, round, user_id, bonus_points, created_at)
          VALUES (?, ?, ?, ?, 3.00, ?)
        `).run(bonusId, leagueId, round, winner.user_id, now);

        console.log(`⭐ Bónus de +3 pts atribuído a ${winner.user_id} na liga ${leagueId} (Jornada ${round})`);
      }

      this.recalculateLeagueBalances(leagueId);
    }
  }
};
