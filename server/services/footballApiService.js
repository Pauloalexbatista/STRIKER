import { db } from '../db/database.js';
import { EconomyService } from './economyService.js';

const API_KEY = process.env.FOOTBALL_DATA_KEY || '18e25bca121b4b829177e56f8a02d44d';
const BASE_URL = 'https://api.football-data.org/v4';

// Mapeamento dos nomes/TLAs da API para os IDs oficiais da nossa BD
const TEAM_MAP = {
  'SPO': 'SCP',
  'BEN': 'SLB',
  'FCP': 'FCP',
  'SCB': 'SCB',
  'GUI': 'VSC',
  'FAM': 'FCF',
  'MOR': 'MFC',
  'GIL': 'GVC',
  'RIO': 'RAV',
  'EST': 'EST',
  'BOA': 'BFC',
  'CAS': 'CPAC',
  'FCA': 'FCA',
  'CDN': 'CDN',
  'CD ': 'CDSC',
  'SCF': 'SCF',
  'AVS': 'AVS',
  'AMA': 'CFEA',
  // Nomes alternativos
  'Sporting CP': 'SCP',
  'SL Benfica': 'SLB',
  'Porto': 'FCP',
  'Braga': 'SCB',
  'Vitória SC': 'VSC',
  'Famalicão': 'FCF',
  'Moreirense': 'MFC',
  'Gil Vicente': 'GVC',
  'Rio Ave': 'RAV',
  'Estoril Praia': 'EST',
  'Arouca': 'FCA',
  'Santa Clara': 'CDSC',
  'Casa Pia': 'CPAC',
  'Amadora': 'CFEA'
};

function resolveClubId(team) {
  if (!team) return 'SCP';
  if (team.tla && TEAM_MAP[team.tla]) return TEAM_MAP[team.tla];
  if (team.shortName && TEAM_MAP[team.shortName]) return TEAM_MAP[team.shortName];
  if (team.name && TEAM_MAP[team.name]) return TEAM_MAP[team.name];

  // Fallback por pesquisa
  const name = (team.shortName || team.name || '').toLowerCase();
  if (name.includes('sporting')) return 'SCP';
  if (name.includes('benfica')) return 'SLB';
  if (name.includes('porto')) return 'FCP';
  if (name.includes('braga')) return 'SCB';
  if (name.includes('vitória') || name.includes('guimarães')) return 'VSC';
  if (name.includes('famalicão')) return 'FCF';
  if (name.includes('moreirense')) return 'MFC';
  if (name.includes('gil vicente')) return 'GVC';
  if (name.includes('rio ave')) return 'RAV';
  if (name.includes('estoril')) return 'EST';
  if (name.includes('boavista')) return 'BFC';
  if (name.includes('casa pia')) return 'CPAC';
  if (name.includes('arouca')) return 'FCA';
  if (name.includes('nacional')) return 'CDN';
  if (name.includes('santa clara')) return 'CDSC';
  if (name.includes('farense')) return 'SCF';
  if (name.includes('estrela') || name.includes('amadora')) return 'CFEA';

  return 'SCP';
}

export const FootballApiService = {
  async syncMatchday(matchday = 3) {
    try {
      console.log(`📡 A consultar football-data.org para a Jornada ${matchday}...`);
      const res = await fetch(`${BASE_URL}/competitions/PPL/matches?matchday=${matchday}`, {
        headers: { 'X-Auth-Token': API_KEY }
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data.matches || data.matches.length === 0) {
        return { success: false, message: 'Nenhum jogo encontrado' };
      }

      let updatedCount = 0;

      for (const m of data.matches) {
        const gameId = `fd_${m.id}`;
        const homeId = resolveClubId(m.homeTeam);
        const awayId = resolveClubId(m.awayTeam);
        const kickoff = m.utcDate;
        const round = m.matchday || matchday;

        // Verificar se jogo já existe
        const existing = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);

        if (!existing) {
          // Criar novo jogo
          db.prepare(`
            INSERT INTO games (id, round, home_club_id, away_club_id, kickoff_time, status, home_score, away_score, result, pool_points)
            VALUES (?, ?, ?, ?, ?, 'UPCOMING', null, null, null, 0.00)
          `).run(gameId, round, homeId, awayId, kickoff);
          updatedCount++;
        }

        // Se o jogo está a decorrer (IN_PLAY / PAUSED)
        if (m.status === 'IN_PLAY' || m.status === 'PAUSED') {
          EconomyService.lockGameAtKickoff(gameId);
          if (m.score && m.score.fullTime) {
            db.prepare('UPDATE games SET home_score = ?, away_score = ? WHERE id = ?')
              .run(m.score.fullTime.home, m.score.fullTime.away, gameId);
          }
        }

        // Se o jogo TERMINOU (FINISHED)
        if (m.status === 'FINISHED' && m.score && m.score.fullTime && m.score.fullTime.home !== null) {
          const homeScore = m.score.fullTime.home;
          const awayScore = m.score.fullTime.away;
          EconomyService.settleGame(gameId, homeScore, awayScore);
          updatedCount++;
        }
      }

      console.log(`✅ Sincronização concluída: ${data.matches.length} jogos processados.`);
      return { success: true, count: data.matches.length, matches: data.matches };
    } catch (err) {
      console.error('Erro na sincronização da API de futebol:', err.message);
      return { success: false, error: err.message };
    }
  },

  // Iniciar sincronização periódica (a cada 30 minutos)
  startAutoSync(intervalMinutes = 30) {
    console.log(`🤖 Robô de futebol automático ativado (intervalo: ${intervalMinutes}m)`);
    // Sincroniza logo ao arrancar
    this.syncMatchday(3);

    setInterval(() => {
      this.syncMatchday(3);
    }, intervalMinutes * 60 * 1000);
  }
};
