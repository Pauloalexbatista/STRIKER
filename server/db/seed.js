import { db, initDb } from './database.js';

export function seedData() {
  initDb();

  // 1. Seed the 18 Clubs of Primeira Liga
  const clubsCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get().count;
  if (clubsCount === 0) {
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
      { id: 'CFEA', name: 'Estrela da Amadora', short_name: 'ESTRELA', primary_color: '#E11D48', secondary_color: '#16A34A', accent_color: '#FFFFFF' }
    ];

    const insertClub = db.prepare(`
      INSERT INTO clubs (id, name, short_name, primary_color, secondary_color, accent_color)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const c of clubs) {
      insertClub.run(c.id, c.name, c.short_name, c.primary_color, c.secondary_color, c.accent_color);
    }
  }

  // 2. Initial Admin/Host User (Paulo) and Default Striker League
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, name, pin, favorite_club, avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('u_paulo', 'Paulo', '1234', 'SCP', '🦁', now);

    // Initial League
    const leaguesCount = db.prepare('SELECT COUNT(*) as count FROM leagues').get().count;
    if (leaguesCount === 0) {
      db.prepare(`
        INSERT INTO leagues (id, name, code, creator_id, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('l_striker', 'Striker Principal', 'STRIKER', 'u_paulo', now);

      db.prepare(`
        INSERT INTO league_members (league_id, user_id, balance, joined_at)
        VALUES (?, ?, 0.00, ?)
      `).run('l_striker', 'u_paulo', now);
    }
  }

  // 3. Seed the 9 Real Games of the Current Jornada
  const gamesCount = db.prepare('SELECT COUNT(*) as count FROM games').get().count;
  if (gamesCount === 0) {
    const baseTime = Date.now() + 24 * 60 * 60 * 1000; // Começa amanhã à tarde
    const gamesList = [
      { id: 'g_scp_scb', round: 25, home: 'SCP', away: 'SCB', offsetHours: 20 },
      { id: 'g_slb_fcp', round: 25, home: 'SLB', away: 'FCP', offsetHours: 26 },
      { id: 'g_vsc_fcf', round: 25, home: 'VSC', away: 'FCF', offsetHours: 22 },
      { id: 'g_rav_gvc', round: 25, home: 'RAV', away: 'GVC', offsetHours: 18 },
      { id: 'g_mfc_cdsc', round: 25, home: 'MFC', away: 'CDSC', offsetHours: 24 },
      { id: 'g_bfc_est', round: 25, home: 'BFC', away: 'EST', offsetHours: 42 },
      { id: 'g_fca_scf', round: 25, home: 'FCA', away: 'SCF', offsetHours: 44 },
      { id: 'g_cpac_cdn', round: 25, home: 'CPAC', away: 'CDN', offsetHours: 46 },
      { id: 'g_avs_cfea', round: 25, home: 'AVS', away: 'CFEA', offsetHours: 48 }
    ];

    const insertGame = db.prepare(`
      INSERT INTO games (id, round, home_club_id, away_club_id, kickoff_time, status, home_score, away_score, result)
      VALUES (?, ?, ?, ?, ?, 'UPCOMING', null, null, null)
    `);

    for (const g of gamesList) {
      const kickoff = new Date(baseTime + g.offsetHours * 3600 * 1000).toISOString();
      insertGame.run(g.id, g.round, g.home, g.away, kickoff);
    }
  }
}
