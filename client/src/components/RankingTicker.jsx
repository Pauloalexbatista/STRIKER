import React, { useEffect, useState } from 'react';
import { fetchGeneralLeaderboard } from '../services/api';
import { Trophy, Award } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function RankingTicker({ activeLeague, onOpenLeaderboard }) {
  const { activeTheme } = useTheme();
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    if (!activeLeague?.id) return;
    fetchGeneralLeaderboard(activeLeague.id)
      .then(data => {
        if (Array.isArray(data)) {
          setLeaders(data);
        }
      })
      .catch(() => {});
  }, [activeLeague?.id]);

  if (!leaders || leaders.length === 0) return null;

  const renderTickerContent = () => (
    <div className="inline-flex items-center gap-6 px-4">
      {leaders.map((user, idx) => {
        const medal = idx === 0 ? '\u{1F947}' : idx === 1 ? '\u{1F948}' : idx === 2 ? '\u{1F949}' : `#${idx + 1}`;
        const pts = Math.round(Number(user.balance || 0));
        return (
          <div key={user.id || idx} className="inline-flex items-center gap-1.5 shrink-0">
            <span className="font-orbitron font-bold text-[10px]" style={{ color: idx === 0 ? '#ffd700' : '#94a3b8' }}>
              {medal}
            </span>
            <span className="font-bold text-white text-xs">{user.name}</span>
            <span className={`text-[10px] font-orbitron font-bold ${pts > 0 ? 'text-emerald-400' : pts < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              ({pts > 0 ? `+${pts}` : pts} Pts)
            </span>
            <span className="text-slate-600 ml-2">&bull;</span>
          </div>
        );
      })}
      <div className="inline-flex items-center gap-1.5 shrink-0 text-amber-400/80 font-orbitron text-[10px] tracking-wider uppercase">
        <Trophy size={11} className="text-amber-400" />
        <span>Classifica&ccedil;&atilde;o Geral da Liga</span>
        <span className="text-slate-600 ml-2">&bull;</span>
      </div>
    </div>
  );

  return (
    <div 
      onClick={onOpenLeaderboard}
      className="overflow-hidden bg-slate-900/90 border border-slate-800/90 hover:border-amber-400/40 rounded-xl py-1.5 px-2.5 flex items-center shadow-inner cursor-pointer transition-all group"
      title="Clica para abrir as Classifica&ccedil;&otilde;es"
    >
      {/* Badge fixo à esquerda */}
      <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-slate-800 text-[10px] font-orbitron font-black text-amber-400 z-10 bg-slate-900/95">
        <Award size={13} className="text-amber-400" />
        <span>TOP</span>
      </div>

      {/* Faixa animada */}
      <div className="overflow-hidden whitespace-nowrap w-full pl-1">
        <div className="animate-marquee inline-flex items-center">
          {renderTickerContent()}
          {renderTickerContent()}
        </div>
      </div>
    </div>
  );
}