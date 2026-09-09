import React, { useEffect, useState } from 'react';
import { fetchGameReport } from '../services/api';
import { X, Lock, Eye, CheckCircle2, TrendingUp, AlertCircle, Award } from 'lucide-react';

export function ThreeColumnDrawer({ gameId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    fetchGameReport(gameId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching report:', err);
        setLoading(false);
      });
  }, [gameId]);

  if (!gameId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0b0e17] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl safe-bottom overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Drag Bar Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Jornada {data?.game?.round || 25}
              </span>
              {data?.game?.status === 'UPCOMING' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={12} /> APOSTAS SECRETAS
                </span>
              )}
              {data?.game?.status === 'LIVE' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> EM DIRECTO
                </span>
              )}
              {data?.game?.status === 'FINISHED' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 size={12} /> TERMINADO
                </span>
              )}
            </div>
            
            <h2 className="text-base font-bold text-white mt-1.5 font-orbitron">
              {data?.game?.home_short} <span className="text-slate-500 font-normal">vs</span> {data?.game?.away_short}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Total Pool & Economy Banner */}
        <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-400" />
            <span className="text-xs text-slate-300 font-medium">Pote Total do Grupo:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">({data?.totalBets || 0} apostadores)</span>
            <span className="text-sm font-bold font-orbitron text-amber-400">
              {Number(data?.poolPoints || 0).toFixed(2)} pts
            </span>
          </div>
        </div>

        {/* Content Body: The 3 Columns */}
        <div className="p-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
              A carregar relatório das 3 colunas...
            </div>
          ) : (
            <>
              {/* The 3 Columns Grid */}
              <div className="grid grid-cols-3 gap-2">
                
                {/* 1. Coluna CASA */}
                <ColumnBlock 
                  title={data.columns.home.title}
                  subTitle="Vitória Casa (1)"
                  badgeColor={data.game.home_color}
                  bets={data.columns.home.bets}
                  count={data.columns.home.count}
                  isLocked={data.isLocked}
                  isWinner={data.game.status === 'FINISHED' && data.game.result === 'HOME'}
                  status={data.game.status}
                />

                {/* 2. Coluna EMPATE */}
                <ColumnBlock 
                  title="EMPATE"
                  subTitle="Igualdade (X)"
                  badgeColor="#94a3b8"
                  bets={data.columns.draw.bets}
                  count={data.columns.draw.count}
                  isLocked={data.isLocked}
                  isWinner={data.game.status === 'FINISHED' && data.game.result === 'DRAW'}
                  status={data.game.status}
                />

                {/* 3. Coluna FORA */}
                <ColumnBlock 
                  title={data.columns.away.title}
                  subTitle="Vitória Fora (2)"
                  badgeColor={data.game.away_color}
                  bets={data.columns.away.bets}
                  count={data.columns.away.count}
                  isLocked={data.isLocked}
                  isWinner={data.game.status === 'FINISHED' && data.game.result === 'AWAY'}
                  status={data.game.status}
                />

              </div>

              {/* Status Note Footer */}
              {!data.isLocked ? (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                  <Lock size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-300">Apostas Secretas:</strong> Antes do apito inicial, podes ver a quantidade de apostas em cada coluna, mas os nomes dos apostadores permanecem ocultos para garantir jogo limpo.
                  </p>
                </div>
              ) : data.game.status === 'LIVE' ? (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
                  <Eye size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    <strong className="text-rose-300">Jogo a Decorrer:</strong> Todos os palpites foram revelados. A taxa de entrada de <span className="font-mono text-rose-300 font-bold">-1.00 pt</span> foi registada. No apito final, os vencedores dividem o pote!
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                  <Award size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    <strong className="text-emerald-300">Resultado Oficial Registado:</strong> A coluna vencedora está assinalada. Os pontos líquidos já foram creditados na conta dos vencedores.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ColumnBlock({ title, subTitle, badgeColor, bets, count, isLocked, isWinner, status }) {
  return (
    <div className={`rounded-xl border flex flex-col p-2.5 transition-all ${
      isWinner 
        ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
        : 'bg-slate-900/60 border-slate-800'
    }`}>
      {/* Column Title */}
      <div className="text-center pb-2 border-b border-slate-800">
        <div className="text-[11px] font-bold text-white truncate tracking-wide font-orbitron" title={title}>
          {title}
        </div>
        <div className="text-[9px] text-slate-400">{subTitle}</div>
        
        {/* Count badge */}
        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-200 font-orbitron">
          {count} <span className="text-[9px] text-slate-400 font-normal">{count === 1 ? 'aposta' : 'apostas'}</span>
        </div>

        {isWinner && (
          <div className="mt-1 text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center justify-center gap-1">
            <CheckCircle2 size={12} /> VENCEDOR
          </div>
        )}
      </div>

      {/* Bets List */}
      <div className="mt-2 space-y-1.5 flex-1 min-h-[120px]">
        {!isLocked ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-2 text-slate-500 text-[11px]">
            <Lock size={18} className="mb-1 text-slate-600" />
            <span>Nomes em segredo</span>
          </div>
        ) : bets.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-[10px] italic">
            Sem apostas
          </div>
        ) : (
          bets.map((b) => (
            <div 
              key={b.id}
              className={`p-1.5 rounded-lg border text-left flex items-center justify-between text-[11px] ${
                b.net_points > 0 
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200' 
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs shrink-0">{b.user_avatar || '⚽'}</span>
                <span className="truncate font-medium text-[10px] text-slate-200" title={b.user_name}>
                  {b.user_name.split(' ')[0]}
                </span>
              </div>

              {/* Points tag */}
              <div className="shrink-0 text-right">
                {status === 'FINISHED' ? (
                  b.net_points > 0 ? (
                    <span className="font-bold text-emerald-400 font-orbitron text-[10px]">
                      +{Number(b.net_points).toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-400 font-orbitron text-[10px]">
                      -1.00
                    </span>
                  )
                ) : (
                  <span className="text-rose-400/80 font-mono text-[10px]">
                    -1.00
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
