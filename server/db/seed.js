import { db, initDb } from './database.js';

export function seedData() {
  initDb();

  // 1. Seed Clubs
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

  // 2. Seed Users
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount === 0) {
    const users = [
      { id: 'u1', name: 'Paulo (Você)', favorite_club: 'SCP', balance: 5.00, avatar: '🦁' },
      { id: 'u2', name: 'Miguel Costa', favorite_club: 'SLB', balance: -1.00, avatar: '🦅' },
      { id: 'u3', name: 'Tiago Silva', favorite_club: 'FCP', balance: -1.00, avatar: '🐉' },
      { id: 'u4', name: 'André Matos', favorite_club: 'SCP', balance: 5.00, avatar: '🦁' },
      { id: 'u5', name: 'Rita Ferreira', favorite_club: 'SLB', balance: -1.00, avatar: '🦅' },
      { id: 'u6', name: 'João Pinho', favorite_club: 'FCP', balance: -1.00, avatar: '🐉' },
      { id: 'u7', name: 'Carlos Reis', favorite_club: 'SCB', balance: -1.00, avatar: '⚔️' },
      { id: 'u8', name: 'Nuno Santos', favorite_club: 'SCP', balance: -1.00, avatar: '🦁' },
      { id: 'u9', name: 'Inês Vieira', favorite_club: 'SLB', balance: -1.00, avatar: '🦅' },
      { id: 'u10', name: 'Rui Rocha', favorite_club: 'FCP', balance: -1.00, avatar: '🐉' }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, favorite_club, balance, avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const u of users) {
      insertUser.run(u.id, u.name, u.favorite_club, u.balance, u.avatar, now);
    }
  }

  // 3. Seed Games for Jornada 25
  const gamesCount = db.prepare('SELECT COUNT(*) as count FROM games').get().count;
  if (gamesCount === 0) {
    const now = Date.now();
    const t1 = new Date(now + 45 * 60 * 1000).toISOString();
    const t2 = new Date(now - 30 * 60 * 1000).toISOString();
    const t3 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const t4 = new Date(now + 24 * 60 * 60 * 1000).toISOString();

    const insertGame = db.prepare(`
      INSERT INTO games (id, round, home_club_id, away_club_id, kickoff_time, status, home_score, away_score, result, pool_points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertGame.run('g1', 25, 'SCP', 'SCB', t1, 'UPCOMING', null, null, null, 8.00);
    insertGame.run('g2', 25, 'SLB', 'FCP', t2, 'LIVE', 1, 0, null, 10.00);
    insertGame.run('g3', 25, 'VSC', 'FCF', t3, 'FINISHED', 2, 1, 'HOME', 10.00);
    insertGame.run('g4', 25, 'GVC', 'RAV', t4, 'UPCOMING', null, null, null, 0.00);

    // 4. Seed Predictions
    const insertPred = db.prepare(`
      INSERT INTO predictions (id, user_id, game_id, choice, created_at, deducted, points_won, net_points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const nowIso = new Date().toISOString();

    // g1 bets (UPCOMING - names secret)
    insertPred.run('p1', 'u1', 'g1', 'HOME', nowIso, 0, 0.00, 0.00);
    insertPred.run('p2', 'u2', 'g1', 'DRAW', nowIso, 0, 0.00, 0.00);
    insertPred.run('p3', 'u3', 'g1', 'AWAY', nowIso, 0, 0.00, 0.00);
    insertPred.run('p4', 'u4', 'g1', 'HOME', nowIso, 0, 0.00, 0.00);
    insertPred.run('p5', 'u5', 'g1', 'HOME', nowIso, 0, 0.00, 0.00);
    insertPred.run('p6', 'u6', 'g1', 'DRAW', nowIso, 0, 0.00, 0.00);
    insertPred.run('p7', 'u7', 'g1', 'AWAY', nowIso, 0, 0.00, 0.00);
    insertPred.run('p8', 'u8', 'g1', 'HOME', nowIso, 0, 0.00, 0.00);

    // g2 bets (LIVE - started, names revealed, contas SÓ no final!)
    insertPred.run('p9', 'u1', 'g2', 'DRAW', nowIso, 0, 0.00, 0.00);
    insertPred.run('p10', 'u2', 'g2', 'HOME', nowIso, 0, 0.00, 0.00);
    insertPred.run('p11', 'u3', 'g2', 'AWAY', nowIso, 0, 0.00, 0.00);
    insertPred.run('p12', 'u4', 'g2', 'DRAW', nowIso, 0, 0.00, 0.00);
    insertPred.run('p13', 'u5', 'g2', 'HOME', nowIso, 0, 0.00, 0.00);
    insertPred.run('p14', 'u6', 'g2', 'AWAY', nowIso, 0, 0.00, 0.00);
    insertPred.run('p15', 'u7', 'g2', 'HOME', nowIso, 0, 0.00, 0.00);
    insertPred.run('p16', 'u8', 'g2', 'DRAW', nowIso, 0, 0.00, 0.00);
    insertPred.run('p17', 'u9', 'g2', 'HOME', nowIso, 0, 0.00, 0.00);
    insertPred.run('p18', 'u10', 'g2', 'AWAY', nowIso, 0, 0.00, 0.00);

    // g3 bets (FINISHED - Vitória 2-1 Famalicão. 10 apostadores = 10 pts. 2 acertaram (u1, u4) -> cada um ganha 5.00 pts! Os outros 8 perdem 1.00 pt!)
    insertPred.run('p19', 'u1', 'g3', 'HOME', nowIso, 1, 5.00, 5.00);
    insertPred.run('p20', 'u4', 'g3', 'HOME', nowIso, 1, 5.00, 5.00);
    insertPred.run('p21', 'u2', 'g3', 'DRAW', nowIso, 1, 0.00, -1.00);
    insertPred.run('p22', 'u3', 'g3', 'AWAY', nowIso, 1, 0.00, -1.00);
    insertPred.run('p23', 'u5', 'g3', 'DRAW', nowIso, 1, 0.00, -1.00);
    insertPred.run('p24', 'u6', 'g3', 'AWAY', nowIso, 1, 0.00, -1.00);
    insertPred.run('p25', 'u7', 'g3', 'DRAW', nowIso, 1, 0.00, -1.00);
    insertPred.run('p26', 'u8', 'g3', 'AWAY', nowIso, 1, 0.00, -1.00);
    insertPred.run('p27', 'u9', 'g3', 'DRAW', nowIso, 1, 0.00, -1.00);
    insertPred.run('p28', 'u10', 'g3', 'AWAY', nowIso, 1, 0.00, -1.00);
  }
}
