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
  'ALV': 'ALV',
  'ACV': 'ACV',
  'CSM': 'CSM',
  // Nomes alternativos
  'Sporting CP': 'SCP',
  'SL Benfica': 'SLB',
  'FC Porto': 'FCP',
  'Porto': 'FCP',
  'SC Braga': 'SCB',
  'Braga': 'SCB',
  'Vitória SC': 'VSC',
  'FC Famalicão': 'FCF',
  'Famalicão': 'FCF',
  'Moreirense FC': 'MFC',
  'Moreirense': 'MFC',
  'Gil Vicente FC': 'GVC',
  'Gil Vicente': 'GVC',
  'Rio Ave FC': 'RAV',
  'Rio Ave': 'RAV',
  'GD Estoril Praia': 'EST',
  'Estoril Praia': 'EST',
  'Estoril': 'EST',
  'Boavista FC': 'BFC',
  'Boavista': 'BFC',
  'FC Arouca': 'FCA',
  'Arouca': 'FCA',
  'CD Santa Clara': 'CDSC',
  'Santa Clara': 'CDSC',
  'Casa Pia AC': 'CPAC',
  'Casa Pia': 'CPAC',
  'CF Estrela da Amadora': 'CFEA',
  'Estrela da Amadora': 'CFEA',
  'Amadora': 'CFEA',
  'CD Nacional': 'CDN',
  'Nacional': 'CDN',
  'FC Alverca': 'ALV',
  'Alverca': 'ALV',
  'Académico de Viseu FC': 'ACV',
  'Académico de Viseu': 'ACV',
  'Academico de Viseu': 'ACV',
  'CS Marítimo': 'CSM',
  'Marítimo': 'CSM',
  'Maritimo': 'CSM',
  'SC Farense': 'SCF',
  'Farense': 'SCF',
  'AVS Futebol SAD': 'AVS',
  'AVS SAD': 'AVS'
};

function resolveClubId(team) {
  if (!team) return 'SCP';
  if (team.tla && TEAM_MAP[team.tla]) return TEAM_MAP[team.tla];
  if (team.shortName && TEAM_MAP[team.shortName]) return TEAM_MAP[team.shortName];
  if (team.name && TEAM_MAP[team.name]) return TEAM_MAP[team.name];

  const name = (team.shortName || team.name || '').toLowerCase();
  if (name.includes('sporting')) return 'SCP';
  if (name.includes('benfica')) return 'SLB';
  if (name.includes('porto')) return 'FCP';
  if (name.includes('braga')) return 'SCB';
  if (name.includes('vitória') || name.includes('vitoria') || name.includes('guimar')) return 'VSC';
  if (name.includes('famalic')) return 'FCF';
  if (name.includes('moreirense')) return 'MFC';
  if (name.includes('gil vicente')) return 'GVC';
  if (name.includes('rio ave')) return 'RAV';
  if (name.includes('estoril')) return 'EST';
  if (name.includes('boavista')) return 'BFC';
  if (name.includes('casa pia')) return 'CPAC';
  if (name.includes('arouca')) return 'FCA';
  if (name.includes('nacional')) return 'CDN';
  if (name.includes('alverca')) return 'ALV';
  if (name.includes('acad') || name.includes('viseu')) return 'ACV';
  if (name.includes('marítimo') || name.includes('maritimo')) return 'CSM';
  if (name.includes('santa clara')) return 'CDSC';
  if (name.includes('farense')) return 'SCF';
  if (name.includes('estrela') || name.includes('amadora')) return 'CFEA';
  if (name.includes('avs')) return 'AVS';

  return 'SCP';
}

export const FootballApiService = {
  async syncMatchday(matchday = 6) {
    try {
      console.log(`⚽ A consultar football-data.org para a Jornada ${matchday}...`);
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
        const homeId = resolveClubId(m.homeTeam);
        const awayId = resolveClubId(m.awayTeam);
        const round = m.matchday || matchday;

        const existing = db.prepare(`
          SELECT * FROM games 
          WHERE round = ? AND home_club_id = ? AND away_club_id = ?
        `).get(round, homeId, awayId);

        if (!existing) {
          continue;
        }

        const targetGameId = existing.id;

        // Critério robusto de fim de jogo:
        // 1. Status oficial FINISHED
        // 2. Ou status IN_PLAY/PAUSED mas com winner atribuído pela API e mais de 105 minutos decorridos
        const isFinished = m.status === 'FINISHED' || (
          (m.status === 'IN_PLAY' || m.status === 'PAUSED') &&
          m.score?.winner !== null &&
          m.score?.fullTime?.home !== null &&
          m.score?.fullTime?.away !== null &&
          (Date.now() - new Date(m.utcDate).getTime() > 105 * 60 * 1000)
        );

        // Se o jogo TERMINOU
        if (isFinished && m.score && m.score.fullTime && m.score.fullTime.home !== null) {
          const homeScore = m.score.fullTime.home;
          const awayScore = m.score.fullTime.away;
          EconomyService.settleGame(targetGameId, homeScore, awayScore);
          updatedCount++;
        } 
        // Se o jogo está a decorrer (IN_PLAY / PAUSED)
        else if (m.status === 'IN_PLAY' || m.status === 'PAUSED') {
          EconomyService.lockGameAtKickoff(targetGameId);
          const homeScore = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0;
          const awayScore = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0;
          db.prepare("UPDATE games SET status = 'LIVE', home_score = ?, away_score = ? WHERE id = ?")
            .run(homeScore, awayScore, targetGameId);
          updatedCount++;
        }
      }

      this.lastSyncTime = Date.now();
      console.log(`✅ Sincronização concluída: ${data.matches.length} jogos processados, ${updatedCount} atualizados.`);
      return { success: true, count: data.matches.length, matches: data.matches };
    } catch (err) {
      console.error('Erro na sincronização da API de futebol:', err.message);
      return { success: false, error: err.message };
    }
  },

  lastSyncTime: 0,

  // Iniciar sincronização periódica a cada 1 minuto
  startAutoSync(intervalMinutes = 1) {
    console.log(`🤖 Robô de futebol automático ativado (intervalo: ${intervalMinutes}m)`);
    // Sincroniza logo ao arrancar
    this.syncMatchday(6);

    setInterval(() => {
      this.syncMatchday(6);
    }, intervalMinutes * 60 * 1000);
  }
};
