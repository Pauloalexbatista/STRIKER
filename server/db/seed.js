import { db } from './database.js';
import { EconomyService } from '../services/economyService.js';

export function seedData() {
  // 1. Seed Clubs limpos em UTF-8
  const clubs = [
    { id: 'SCP', name: 'Sporting CP', short_name: 'SPORTING CP', primary_color: '#00D166', secondary_color: '#FFFFFF', accent_color: '#00A34F' },
    { id: 'SLB', name: 'SL Benfica', short_name: 'SL BENFICA', primary_color: '#FF2E4D', secondary_color: '#FFFFFF', accent_color: '#D80027' },
    { id: 'FCP', name: 'FC Porto', short_name: 'FC PORTO', primary_color: '#007AFF', secondary_color: '#FFFFFF', accent_color: '#004F9F' },
    { id: 'SCB', name: 'SC Braga', short_name: 'SC BRAGA', primary_color: '#E30613', secondary_color: '#FFFFFF', accent_color: '#C2000A' },
    { id: 'VSC', name: 'Vitória SC', short_name: 'VITÓRIA SC', primary_color: '#F0F0F0', secondary_color: '#1A1A1A', accent_color: '#D4AF37' },
    { id: 'FCF', name: 'FC Famalicão', short_name: 'FAMALICÃO', primary_color: '#1E40AF', secondary_color: '#FFFFFF', accent_color: '#004098' },
    { id: 'MFC', name: 'Moreirense FC', short_name: 'MOREIRENSE', primary_color: '#059669', secondary_color: '#FFFFFF', accent_color: '#005C26' },
    { id: 'GVC', name: 'Gil Vicente FC', short_name: 'GIL VICENTE', primary_color: '#DC2626', secondary_color: '#1D4ED8', accent_color: '#E6A100' },
    { id: 'RAV', name: 'Rio Ave FC', short_name: 'RIO AVE', primary_color: '#10B981', secondary_color: '#FFFFFF', accent_color: '#008037' },
    { id: 'EST', name: 'GD Estoril Praia', short_name: 'ESTORIL', primary_color: '#FACC15', secondary_color: '#1E3A8A', accent_color: '#EAB308' },
    { id: 'BFC', name: 'Boavista FC', short_name: 'BOAVISTA', primary_color: '#4B5563', secondary_color: '#FFFFFF', accent_color: '#1F2937' },
    { id: 'CPAC', name: 'Casa Pia AC', short_name: 'CASA PIA', primary_color: '#374151', secondary_color: '#FFFFFF', accent_color: '#111827' },
    { id: 'FCA', name: 'FC Arouca', short_name: 'AROUCA', primary_color: '#F59E0B', secondary_color: '#1E3A8A', accent_color: '#D97706' },
    { id: 'CDN', name: 'CD Nacional', short_name: 'NACIONAL', primary_color: '#6B7280', secondary_color: '#FFFFFF', accent_color: '#1F2937' },
    { id: 'CDSC', name: 'Santa Clara', short_name: 'SANTA CLARA', primary_color: '#EF4444', secondary_color: '#FFFFFF', accent_color: '#B91C1C' },
    { id: 'SCF', name: 'SC Farense', short_name: 'FARENSE', primary_color: '#1F2937', secondary_color: '#DC2626', accent_color: '#000000' },
    { id: 'AVS', name: 'AVS Futebol SAD', short_name: 'AVS SAD', primary_color: '#991B1B', secondary_color: '#FBBF24', accent_color: '#7F1D1D' },
    { id: 'CFEA', name: 'Estrela da Amadora', short_name: 'ESTRELA', primary_color: '#E11D48', secondary_color: '#16A34A', accent_color: '#FFFFFF' },
    { id: 'ALV', name: 'FC Alverca', short_name: 'ALVERCA', primary_color: '#1E3A8A', secondary_color: '#FFFFFF', accent_color: '#3B82F6' },
    { id: 'ACV', name: 'Académico de Viseu', short_name: 'AC. VISEU', primary_color: '#1F2937', secondary_color: '#FFFFFF', accent_color: '#4B5563' },
    { id: 'CSM', name: 'CS Marítimo', short_name: 'MARÍTIMO', primary_color: '#059669', secondary_color: '#DC2626', accent_color: '#10B981' }
  ];

  const insertClub = db.prepare(`
    INSERT OR REPLACE INTO clubs (id, name, short_name, primary_color, secondary_color, accent_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const c of clubs) {
    insertClub.run(c.id, c.name, c.short_name, c.primary_color, c.secondary_color, c.accent_color);
  }

  // 2. Corrigir e limpar utilizadores com avatares ou nomes corrompidos por mojibake na BD
  try {
    const clubAvatars = {
      SCP: '🦁',
      SLB: '🦅',
      FCP: '🐉',
      SCB: '⚔️',
      VSC: '🛡️',
      GOLD: '⚡'
    };

    const users = db.prepare('SELECT id, name, favorite_club, avatar FROM users').all();
    for (const u of users) {
      const cleanAvatar = clubAvatars[u.favorite_club] || '⚽';
      let cleanName = u.name;

      if (u.id === 'u_paulo' && (cleanName.includes('Ã') || cleanName.includes('ǟ') || cleanName.length > 15)) {
        cleanName = 'Paulo';
      }

      const needsAvatarFix = !u.avatar || u.avatar.includes('Ã') || u.avatar.includes('ǟ') || u.avatar.length > 4;
      const needsNameFix = cleanName !== u.name;

      if (needsAvatarFix || needsNameFix) {
        db.prepare('UPDATE users SET avatar = ?, name = ? WHERE id = ?').run(
          needsAvatarFix ? cleanAvatar : u.avatar,
          cleanName,
          u.id
        );
      }
    }
  } catch (err) {
    console.error('Erro na limpeza de avatares:', err);
  }

  // 3. Garantir que os 9 Jogos Oficiais da Jornada 6 existem e estão 100% FINALIZADOS
  try {
    const jornada6Official = [
      { id: 'g_j6_cdn_alv', round: 6, home: 'CDN', away: 'ALV', kickoff: '2026-09-12T14:30:00Z', homeScore: 1, awayScore: 3 },
      { id: 'g_j6_cpac_fcp', round: 6, home: 'CPAC', away: 'FCP', kickoff: '2026-09-12T17:00:00Z', homeScore: 1, awayScore: 4 },
      { id: 'g_j6_acv_vsc', round: 6, home: 'ACV', away: 'VSC', kickoff: '2026-09-12T19:30:00Z', homeScore: 2, awayScore: 1 },
      { id: 'g_j6_fca_cdsc', round: 6, home: 'FCA', away: 'CDSC', kickoff: '2026-09-13T17:00:00Z', homeScore: 1, awayScore: 2 },
      { id: 'g_j6_slb_gvc', round: 6, home: 'SLB', away: 'GVC', kickoff: '2026-09-13T17:00:00Z', homeScore: 3, awayScore: 1 },
      { id: 'g_j6_fcf_scp', round: 6, home: 'FCF', away: 'SCP', kickoff: '2026-09-13T19:30:00Z', homeScore: 1, awayScore: 1 },
      { id: 'g_j6_rav_cfea', round: 6, home: 'RAV', away: 'CFEA', kickoff: '2026-09-14T17:45:00Z', homeScore: 3, awayScore: 3 },
      { id: 'g_j6_mfc_csm', round: 6, home: 'MFC', away: 'CSM', kickoff: '2026-09-14T19:15:00Z', homeScore: 3, awayScore: 1 },
      { id: 'g_j6_scb_est', round: 6, home: 'SCB', away: 'EST', kickoff: '2026-09-14T19:45:00Z', homeScore: 1, awayScore: 0 }
    ];

    for (const g of jornada6Official) {
      const existing = db.prepare('SELECT * FROM games WHERE id = ?').get(g.id);
      if (!existing) {
        db.prepare(`
          INSERT INTO games (id, round, home_club_id, away_club_id, kickoff_time, status, home_score, away_score, result)
          VALUES (?, ?, ?, ?, ?, 'FINISHED', ?, ?, ?)
        `).run(g.id, g.round, g.home, g.away, g.kickoff, g.homeScore, g.awayScore, g.homeScore > g.awayScore ? 'HOME' : g.awayScore > g.homeScore ? 'AWAY' : 'DRAW');
      }
      // Se não estava como FINISHED com estes resultados, liquidar oficialmente
      if (!existing || existing.status !== 'FINISHED' || existing.home_score !== g.homeScore || existing.away_score !== g.awayScore) {
        EconomyService.settleGame(g.id, g.homeScore, g.awayScore);
      }
    }
  } catch (err) {
    console.error('Erro ao garantir jogos da Jornada 6:', err);
  }

  // 4. Garantir que os 9 Jogos da Jornada 7 existem na BD
  try {
    const jornada7Games = [
      { id: 'g_j7_scp_mfc', round: 7, home: 'SCP', away: 'MFC', kickoff: '2026-09-19T17:00:00Z' },
      { id: 'g_j7_fcp_acv', round: 7, home: 'FCP', away: 'ACV', kickoff: '2026-09-19T19:30:00Z' },
      { id: 'g_j7_alv_cpac', round: 7, home: 'ALV', away: 'CPAC', kickoff: '2026-09-20T14:30:00Z' },
      { id: 'g_j7_cdsc_slb', round: 7, home: 'CDSC', away: 'SLB', kickoff: '2026-09-20T17:00:00Z' },
      { id: 'g_j7_vsc_scb', round: 7, home: 'VSC', away: 'SCB', kickoff: '2026-09-20T19:30:00Z' },
      { id: 'g_j7_gvc_fca', round: 7, home: 'GVC', away: 'FCA', kickoff: '2026-09-21T18:00:00Z' },
      { id: 'g_j7_csm_rav', round: 7, home: 'CSM', away: 'RAV', kickoff: '2026-09-21T18:45:00Z' },
      { id: 'g_j7_est_fcf', round: 7, home: 'EST', away: 'FCF', kickoff: '2026-09-21T20:15:00Z' },
      { id: 'g_j7_cfea_cdn', round: 7, home: 'CFEA', away: 'CDN', kickoff: '2026-09-21T20:45:00Z' }
    ];

    for (const g of jornada7Games) {
      const existing = db.prepare('SELECT id FROM games WHERE id = ?').get(g.id);
      if (!existing) {
        db.prepare(`
          INSERT INTO games (id, round, home_club_id, away_club_id, kickoff_time, status)
          VALUES (?, ?, ?, ?, ?, 'UPCOMING')
        `).run(g.id, g.round, g.home, g.away, g.kickoff);
      }
    }
  } catch (err) {
    console.error('Erro ao garantir jogos da Jornada 7:', err);
  }

  // 5. Eliminar previsões duplicadas na base de dados e recalcular pontuações
  try {
    db.exec(`
      DELETE FROM predictions 
      WHERE league_id IS NULL 
      AND EXISTS (
        SELECT 1 FROM predictions p2 
        WHERE p2.user_id = predictions.user_id 
          AND p2.game_id = predictions.game_id 
          AND p2.league_id IS NOT NULL
      );
    `);

    db.exec(`
      DELETE FROM predictions 
      WHERE rowid NOT IN (
        SELECT MIN(rowid) 
        FROM predictions 
        GROUP BY user_id, game_id, COALESCE(league_id, '')
      );
    `);

    // Calibrar pontuações de todos os jogos FINISHED (+3, -1, -2)
    const finishedGames = db.prepare("SELECT id, result FROM games WHERE status = 'FINISHED'").all();
    for (const fg of finishedGames) {
      db.prepare("UPDATE predictions SET points_won = 3.00, net_points = 3.00 WHERE game_id = ? AND choice = ? AND choice != 'MISSED'").run(fg.id, fg.result);
      db.prepare("UPDATE predictions SET points_won = 0.00, net_points = -1.00 WHERE game_id = ? AND choice != ? AND choice != 'MISSED'").run(fg.id, fg.result);
      db.prepare("UPDATE predictions SET points_won = 0.00, net_points = -2.00 WHERE game_id = ? AND choice = 'MISSED'").run(fg.id);
    }

    // Atribuir bónus de campeão à vencedora da Jornada 6 (Anne)
    EconomyService.checkAndAwardRoundBonus(6);

    // Recalcular saldos de forma determinística
    EconomyService.recalculateAllBalances();
    console.log('✅ Base de dados calibrada, Jogos J6/J7 confirmados e saldos recalculados com sucesso!');
  } catch (err) {
    console.error('Erro na limpeza/recalculo de previsões:', err);
  }
}
