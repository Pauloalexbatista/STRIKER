import { db } from './database.js';
import { EconomyService } from '../services/economyService.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function seedData() {
  // 1. Seed Clubs limpos em UTF-8 (18 oficiais da 1ª Liga + 3 suplementares)
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
      GOLD: '👑'
    };

    const users = db.prepare('SELECT id, name, favorite_club, avatar FROM users').all();
    for (const u of users) {
      const cleanAvatar = clubAvatars[u.favorite_club] || '👑';
      let cleanName = u.name;

      if (u.id === 'u_paulo' && (cleanName.includes('') || cleanName.includes('Paulo') === false || cleanName.length > 15)) {
        cleanName = 'Paulo';
      }

      const needsAvatarFix = !u.avatar || u.avatar.includes('') || u.avatar.length > 4;
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

  // 3. Limpeza Segura: Purgar previsões, bónus e jogos de teste/antigos que não pertençam à J6
  // (Jornada 6 é 100% PRESERVADA)
  try {
    // Eliminar previsões que não sejam da Jornada 6
    db.exec(`
      DELETE FROM predictions 
      WHERE game_id NOT IN (SELECT id FROM games WHERE round = 6);
    `);

    // Eliminar bónus de rondas que não sejam a Jornada 6
    db.exec(`
      DELETE FROM round_bonuses 
      WHERE round != 6;
    `);

    // Eliminar todos os jogos de rondas antigas/falsas que não sejam da Jornada 6
    db.exec(`
      DELETE FROM games 
      WHERE round != 6;
    `);
  } catch (err) {
    console.error('Erro ao purgar dados obsoletos:', err);
  }

  // 4. Importar o Calendário Oficial da Primeira Liga (306 Jogos / 34 Jornadas)
  try {
    const calendarFile = path.join(__dirname, 'calendar.json');
    if (fs.existsSync(calendarFile)) {
      const allMatches = JSON.parse(fs.readFileSync(calendarFile, 'utf8'));
      
      const insertGame = db.prepare(`
        INSERT OR REPLACE INTO games (id, round, home_club_id, away_club_id, kickoff_time, status, home_score, away_score, result)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const m of allMatches) {
        // Para a Jornada 6, manter os registos existentes com os seus IDs oficiais
        if (m.round === 6) {
          const existing = db.prepare('SELECT id FROM games WHERE id = ?').get(m.id);
          if (!existing) {
            insertGame.run(m.id, m.round, m.home_club_id, m.away_club_id, m.kickoff_time, m.status, m.home_score, m.away_score, m.result);
          }
        } else {
          insertGame.run(m.id, m.round, m.home_club_id, m.away_club_id, m.kickoff_time, m.status, m.home_score, m.away_score, m.result);
        }
      }
      console.log(`✅ Calendário Oficial da Primeira Liga carregado (${allMatches.length} jogos).`);
    }
  } catch (err) {
    console.error('Erro ao importar calendário oficial:', err);
  }

  // 5. Garantir calibração rigorosa da Jornada 6 e recalcular saldos
  try {
    // Calibrar pontuações dos 9 jogos oficiais da Jornada 6 (+3 acerto, -1 erro, -2 falta)
    const j6Games = db.prepare("SELECT id, result FROM games WHERE round = 6 AND status = 'FINISHED'").all();
    for (const fg of j6Games) {
      db.prepare("UPDATE predictions SET points_won = 3.00, net_points = 3.00 WHERE game_id = ? AND choice = ? AND choice != 'MISSED'").run(fg.id, fg.result);
      db.prepare("UPDATE predictions SET points_won = 0.00, net_points = -1.00 WHERE game_id = ? AND choice != ? AND choice != 'MISSED'").run(fg.id, fg.result);
      db.prepare("UPDATE predictions SET points_won = 0.00, net_points = -2.00 WHERE game_id = ? AND choice = 'MISSED'").run(fg.id);
    }

    // Garantir bónus de campeão da Anne na J6
    try {
      const anneUser = db.prepare("SELECT id FROM users WHERE LOWER(name) = 'anne' OR LOWER(name) = 'ana'").get();
      if (anneUser) {
        const anneLeagues = db.prepare('SELECT league_id FROM league_members WHERE user_id = ?').all(anneUser.id);
        for (const { league_id } of anneLeagues) {
          const hasB = db.prepare('SELECT COUNT(*) as c FROM round_bonuses WHERE user_id = ? AND round = 6 AND league_id = ?').get(anneUser.id, league_id)?.c;
          if (!hasB) {
            db.prepare(`
              INSERT OR REPLACE INTO round_bonuses (id, league_id, round, user_id, bonus_points, created_at)
              VALUES (?, ?, 6, ?, 3.00, datetime('now'))
            `).run('bonus_j6_' + league_id + '_' + anneUser.id, league_id, anneUser.id);
          }
        }
      }
    } catch (e) {
      console.warn('Aviso bónus Anne:', e.message);
    }

    // Recalcular todos os saldos de forma determinística
    EconomyService.recalculateAllBalances();
    console.log('✅ Base de dados calibrada: Calendário 1ª Liga (34 Jornadas) ativo, J6 preservada, J7 anulada e saldos verificados.');
  } catch (err) {
    console.error('Erro na calibração final:', err);
  }
}
