import React, { useEffect, useState } from 'react';
import { fetchGeneralLeaderboard } from '../services/api';
import { Award } from 'lucide-react';

export function RankingTicker({ activeLeague, onOpenLeaderboard }) {
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
        const pts = Math.round(Number(user.balance || 0));
        const pos = idx + 1;
        const color = pos === 1 ? '#ffd700' : pos === 2 ? '#e2e8f0' : pos === 3 ? '#f59e0b' : '#64748b';
        return (
          <div key={user.id || idx} className="inline-flex items-center gap-2 shrink-0">
            <span 
              className="font-orbitron font-black text-[11px] px-1.5 py-0.5 rounded border"
              style={{ color, borderColor: `${color}55`, backgroundColor: `${color}15` }}
            >
              #{pos}
            </span>
            <span className="font-bold text-white text-xs tracking-wide">{user.name}</span>
            <span className={`text-[11px] font-orbitron font-bold ${pts > 0 ? 'text-emerald-400' : pts < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              ({pts > 0 ? `+${pts}` : pts} Pts)
            </span>
            <span className="text-slate-700 ml-2">&bull;</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div 
      onClick={onOpenLeaderboard}
      className="overflow-hidden bg-slate-900/90 border border-slate-800/90 hover:border-amber-400/40 rounded-xl py-1.5 px-2.5 flex items-center shadow-inner cursor-pointer transition-all group select-none"
      title="Clica para abrir as Classificações"
    >
      {/* Badge fixo TOP à esquerda */}
      <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-slate-800 text-[10px] font-orbitron font-black text-amber-400 z-10 bg-slate-900/95">
        <Award size={13} className="text-amber-400" />
        <span>TOP</span>
      </div>

      {/* Faixa animada de rolagem contínua */}
      <div className="overflow-hidden whitespace-nowrap w-full pl-1">
        <div className="animate-marquee inline-flex items-center">
          {renderTickerContent()}
          {renderTickerContent()}
          {renderTickerContent()}
        </div>
      </div>
    </div>
  );
}
