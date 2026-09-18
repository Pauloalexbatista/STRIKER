import React, { useState, useEffect } from 'react';
import { 
  fetchRoundLeaderboard, 
  fetchGeneralLeaderboard, 
  fetchCurrentRound, 
  fetchUserRoundAudit 
} from '../services/api';
import { 
  Trophy, Medal, Award, X, ChevronLeft, ChevronRight, 
  ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, 
  Clock, Sparkles 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SponsorBanner } from './SponsorBanner';

export function LeaderboardModal({ isOpen, activeLeague, onClose }) {
  const { activeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [round, setRound] = useState(7);
  const [roundData, setRoundData] = useState([]);
  const [roundMeta, setRoundMeta] = useState({ isComplete: false, totalGames: 0, finishedGames: 0 });
  const [generalData, setGeneralData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para auditoria / extrato detalhado por jogador (Ponto 4)
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [auditData, setAuditData] = useState({});
  const [auditLoading, setAuditLoading] = useState(false);

  // Ao abrir, carregar a jornada ativa dinâmica
  useEffect(() => {
    if (isOpen) {
      fetchCurrentRound().then(activeRnd => {
        if (activeRnd && typeof activeRnd === 'number') {
          setRound(activeRnd);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !activeLeague) return;
    setLoading(true);
    setExpandedUserId(null);

    if (activeTab === 'round') {
      fetchRoundLeaderboard(round, activeLeague.id)
        .then(res => {
          setRoundData(res.leaderboard || []);
          setRoundMeta({
            isComplete: res.isComplete || false,
            totalGames: res.totalGames || 0,
            finishedGames: res.finishedGames || 0
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      fetchGeneralLeaderboard(activeLeague.id)
        .then(data => {
          setGeneralData(data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, activeLeague?.id, activeTab, round]);

  // Carregar auditoria detalhada do utilizador
  const handleToggleAudit = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);
    if (!auditData[`${round}_${userId}`]) {
      setAuditLoading(true);
      try {
        const data = await fetchUserRoundAudit(round, userId, activeLeague?.id || '');
        setAuditData(prev => ({ ...prev, [`${round}_${userId}`]: data }));
      } catch (err) {
        console.error('Erro ao carregar auditoria:', err);
      } finally {
        setAuditLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0b0e17] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl safe-bottom overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <h2 className="text-base font-bold text-white font-orbitron">Classificações</h2>
            </div>
            <p className="text-[11px] text-amber-300 font-medium mt-0.5">
              Liga: {activeLeague ? activeLeague.name : 'Geral'}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Award size={14} /> Top Geral da Liga
          </button>
          <button
            onClick={() => setActiveTab('round')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'round'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Medal size={14} /> Top da Jornada
          </button>
        </div>

        {/* Round Selector if activeTab === 'round' */}
        {activeTab === 'round' && (
          <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
            <button
              disabled={round <= 1}
              onClick={() => setRound(r => Math.max(1, r - 1))}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer hover:bg-slate-700"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <div className="text-xs font-bold font-orbitron text-white flex items-center justify-center gap-1.5">
                Jornada {round}
                {roundMeta.isComplete ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans font-medium">
                    Terminada
                  </span>
                ) : roundMeta.finishedGames > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-sans font-medium">
                    {roundMeta.finishedGames}/{roundMeta.totalGames} jogos
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-sans font-medium">
                    A Iniciar
                  </span>
                )}
              </div>
            </div>
            <button
              disabled={round >= 34}
              onClick={() => setRound(r => Math.min(34, r + 1))}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer hover:bg-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Banner de Patrocínio dinâmico com frases bem-humoradas */}
        <div className="px-3 pt-2.5 pb-1">
          <SponsorBanner 
            title={activeTab === 'general' ? 'Patrocínio do campeonato:' : 'Patrocínio da jornada:'} 
            isFooter={false}
          />
        </div>

        {/* Content List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
              A carregar ranking...
            </div>
          ) : activeTab === 'general' ? (
            generalData.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">Sem dados de ranking para esta liga.</div>
            ) : (
              generalData.map((user, idx) => {
                const pts = Math.round(Number(user.balance || 0));
                const isPos = pts > 0;
                const isNeg = pts < 0;
                const bonusCount = user.round_bonuses_count || 0;

                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      idx === 0 
                        ? 'bg-amber-950/25 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.15)]' 
                        : idx === 1
                        ? 'bg-slate-800/40 border-slate-600/50'
                        : idx === 2
                        ? 'bg-amber-900/15 border-amber-700/30'
                        : 'bg-slate-900/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center font-orbitron text-xs font-black">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </div>

                      <span className="text-xl">
                        {(user.avatar && !user.avatar.includes('Ã') && user.avatar.length <= 4) ? user.avatar : '🦁'}
                      </span>

                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>{user.name}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {user.favorite_club}
                          </span>
                          {bonusCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40 flex items-center gap-0.5">
                              👑 {bonusCount}x Campeão (+{bonusCount * 3} pts)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{user.wins || 0} vitórias</span>
                          <span>•</span>
                          <span className="text-cyan-400">{user.efficiency_pct || 0}% eficácia</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-bold font-orbitron ${
                        isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {isPos ? `+${pts}` : pts}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">saldo pts</div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            roundData.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-900/30 rounded-xl border border-slate-800/60 p-4">
                <Clock size={24} className="mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">Jornada {round} sem jogos concluídos</p>
                <p className="text-[11px] text-slate-500 mt-1">Todos os jogadores começam a 0 pts até aos jogos terminarem.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 px-1 flex items-center justify-between">
                  <span>Toca num jogador para ver o boletim e a contabilidade de jogos:</span>
                </div>

                {roundData.map((item, idx) => {
                  const matchPts = Math.round(Number(item.matches_points ?? item.round_points ?? 0));
                  const bonusPts = Math.round(Number(item.bonus_points || 0));
                  const totalPts = Math.round(Number(item.total_round_points ?? (matchPts + bonusPts)));
                  const isExpanded = expandedUserId === item.id;
                  const currentAudit = auditData[`${round}_${item.id}`];
                  const hasBonus = bonusPts > 0;

                  return (
                    <div 
                      key={item.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        hasBonus
                          ? 'bg-amber-950/20 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.12)]'
                          : isExpanded
                          ? 'bg-slate-900 border-slate-600'
                          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Linha Principal do Jogador (Clicável para abrir Auditoria) */}
                      <button
                        type="button"
                        onClick={() => handleToggleAudit(item.id)}
                        className="w-full p-3 flex items-center justify-between text-left cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-center font-orbitron text-xs font-bold text-slate-400">
                            {hasBonus ? '👑' : idx === 0 ? '👑' : `#${idx + 1}`}
                          </div>
                          <span className="text-xl">
                            {(item.avatar && !item.avatar.includes('Ã') && item.avatar.length <= 4) ? item.avatar : '🦁'}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{item.name}</span>
                              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                {item.favorite_club}
                              </span>
                              {hasBonus && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40 flex items-center gap-0.5">
                                  <Sparkles size={10} /> +3 Bónus Campeão
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{item.round_wins || 0} acertos</span>
                              {hasBonus && (
                                <span className="text-amber-400/90 font-medium">
                                  ({matchPts > 0 ? `+${matchPts}` : matchPts} jogos + 3 bónus)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className={`text-sm font-bold font-orbitron ${
                              totalPts > 0 ? (hasBonus ? 'text-amber-300' : 'text-emerald-400') : totalPts < 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {totalPts > 0 ? `+${totalPts}` : totalPts}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono">pts na jornada</div>
                          </div>

                          <div className="text-slate-500 hover:text-slate-300 p-1">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </button>

                      {/* Secção Expandida: Auditoria dos 9 Jogos da Jornada (Ponto 4) */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 bg-slate-950/70 p-3 animate-in slide-in-from-top-2 duration-200">
                          {auditLoading && !currentAudit ? (
                            <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                              A calcular extrato de jogos de {item.name}...
                            </div>
                          ) : currentAudit ? (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 text-[11px]">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                  📋 Boletim de Apostas: {item.name}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {currentAudit.summary?.finishedGames || 0} de {currentAudit.summary?.totalGames || 0} jogos
                                </span>
                              </div>

                              {/* Tabela de Jogos */}
                              <div className="space-y-1.5">
                                {currentAudit.games?.map((g, gIdx) => {
                                  const isHit = g.outcome === 'HIT';
                                  const isMiss = g.outcome === 'MISS';
                                  const isMissed = g.outcome === 'MISSED';
                                  const isPending = g.outcome === 'PENDING';

                                  return (
                                    <div 
                                      key={g.gameId || gIdx}
                                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-[11px]"
                                    >
                                      {/* Confronto e Resultado */}
                                      <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-200 truncate">
                                          <span>{g.homeShort}</span>
                                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 font-mono text-amber-300">
                                            {g.status === 'FINISHED' ? `${g.homeScore} - ${g.awayScore}` : 'vs'}
                                          </span>
                                          <span>{g.awayShort}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                          Aposta: <span className="font-bold text-slate-200">
                                            {g.userChoice === 'HOME' ? '1 (Casa)' : g.userChoice === 'DRAW' ? 'X (Empate)' : g.userChoice === 'AWAY' ? '2 (Fora)' : 'Sem Aposta (Falta)'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Desfecho e Pontos */}
                                      <div className="text-right shrink-0">
                                        {isHit && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                                            <CheckCircle2 size={11} /> +3 pts
                                          </span>
                                        )}
                                        {isMiss && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono">
                                            <XCircle size={11} /> -1 pt
                                          </span>
                                        )}
                                        {isMissed && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono" title="Falta de aposta">
                                            <AlertCircle size={11} /> -2 pts
                                          </span>
                                        )}
                                        {isPending && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                                            <Clock size={10} /> Por jogar
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Resumo Contabilístico da Jornada */}
                              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] bg-slate-900/40 p-2.5 rounded-lg space-y-1 font-mono">
                                <div className="flex justify-between text-slate-300">
                                  <span>Subtotal Jogos ({currentAudit.summary?.hits || 0} acertos):</span>
                                  <span className={currentAudit.summary?.matchesPoints > 0 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                    {currentAudit.summary?.matchesPoints > 0 ? `+${currentAudit.summary.matchesPoints}` : currentAudit.summary?.matchesPoints || 0} pts
                                  </span>
                                </div>

                                {currentAudit.summary?.bonusPoints > 0 && (
                                  <div className="flex justify-between text-amber-300 font-bold">
                                    <span>👑 Bónus Campeão da Jornada:</span>
                                    <span>+{currentAudit.summary.bonusPoints} pts</span>
                                  </div>
                                )}

                                <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800 text-xs">
                                  <span>Total Final da Jornada:</span>
                                  <span className={currentAudit.summary?.totalPoints > 0 ? 'text-emerald-400' : 'text-slate-300'}>
                                    {currentAudit.summary?.totalPoints > 0 ? `+${currentAudit.summary.totalPoints}` : currentAudit.summary?.totalPoints || 0} pts
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center text-xs text-slate-500">
                              Não foi possível carregar os detalhes desta jornada.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
