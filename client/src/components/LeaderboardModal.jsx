import React, { useState, useEffect } from 'react';
import { fetchRoundLeaderboard, fetchGeneralLeaderboard } from '../services/api';
import { Trophy, Medal, Award, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme, hexToRgba } from '../contexts/ThemeContext';

export function LeaderboardModal({ isOpen, activeLeague, onClose }) {
  const { activeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [round, setRound] = useState(6);
  const [roundData, setRoundData] = useState([]);
  const [generalData, setGeneralData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !activeLeague) return;
    setLoading(true);

    if (activeTab === 'round') {
      fetchRoundLeaderboard(round, activeLeague.id)
        .then(res => {
          setRoundData(res.leaderboard || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      fetchGeneralLeaderboard(activeLeague.id)
        .then(res => {
          setGeneralData(res || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, activeTab, round, activeLeague?.id]);

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
              <h2 className="text-base font-bold text-white font-orbitron">ClassificaÃƒÂ§ÃƒÂµes</h2>
            </div>
            <p className="text-[11px] text-amber-300 font-medium mt-0.5">
              Liga: {activeLeague ? activeLeague.name : 'Geral'}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300 shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Award size={14} /> Top Geral da Liga
          </button>
          <button
            onClick={() => setActiveTab('round')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
              className="p-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold font-orbitron text-white">
              Jornada {round}
            </span>
            <button
              disabled={round >= 34}
              onClick={() => setRound(r => Math.min(34, r + 1))}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Banner de Patrocínio dinâmico: Campeonato ou Jornada */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1 flex items-center justify-between">
            <span>{activeTab === 'general' ? 'Patroc&iacute;nio do campeonato:' : 'Patroc&iacute;nio da jornada:'}</span>
            <span className="text-[8px] font-mono" style={{ color: activeTheme?.primary || '#ffd700' }}>OFICIAL</span>
          </div>
          <div 
            className="h-9 rounded-xl border border-dashed flex items-center justify-center transition-all px-3"
            style={{ 
              borderColor: `${hexToRgba(activeTheme?.primary, 0.35)}`, 
              backgroundColor: `${hexToRgba(activeTheme?.primary, 0.05)}`,
              color: activeTheme?.primary || '#ffd700'
            }}
          >
            <span className="text-[10px] font-orbitron font-bold opacity-80 tracking-wider truncate">
              Espa&ccedil;o Reservado para Patrocinador Oficial
            </span>
          </div>
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
                const isPos = Number(user.balance) > 0;
                const isNeg = Number(user.balance) < 0;
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
                        {idx === 0 ? 'Ã°Å¸Â¥â€¡' : idx === 1 ? 'Ã°Å¸Â¥Ë†' : idx === 2 ? 'Ã°Å¸Â¥â€°' : `#${idx + 1}`}
                      </div>

                      <span className="text-xl">{(user.avatar && !user.avatar.includes('Ãƒ') && !user.avatar.includes('Ã°') && user.avatar.length <= 4) ? user.avatar : '\u{1F981}'}</span>

                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {user.name}
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {user.favorite_club}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{user.wins || 0} vitÃƒÂ³rias</span>
                          <span>Ã¢â‚¬Â¢</span>
                          <span className="text-cyan-400">{user.efficiency_pct || 0}% eficÃƒÂ¡cia</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-bold font-orbitron ${
                        isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {isPos ? `+${Number(user.balance).toFixed(2)}` : Number(user.balance).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">saldo pts</div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            roundData.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">Sem jogos concluÃƒÂ­dos nesta jornada.</div>
            ) : (
              roundData.map((item, idx) => {
                const pts = Number(item.round_points || 0);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border bg-slate-900/50 border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center font-orbitron text-xs font-bold text-slate-400">
                        {idx === 0 ? 'Ã°Å¸â€˜â€˜' : `#${idx + 1}`}
                      </div>
                      <span className="text-xl">{(item.avatar && !item.avatar.includes('Ãƒ') && !item.avatar.includes('Ã°') && item.avatar.length <= 4) ? item.avatar : '\u{1F981}'}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.round_wins || 0} acertos</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-bold font-orbitron ${
                        pts > 0 ? 'text-emerald-400' : pts < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {pts > 0 ? `+${pts.toFixed(2)}` : pts.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">pts na jornada</div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

      </div>
    </div>
  );
}
