import React, { useEffect, useState } from 'react';
import { fetchGameReport } from '../services/api';
import { X, Lock, Eye, CheckCircle2, Award, AlertCircle, Sparkles } from 'lucide-react';

export function ThreeColumnDrawer({ gameId, activeLeague, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    fetchGameReport(gameId, activeLeague?.id || '')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching report:', err);
        setLoading(false);
      });
  }, [gameId, activeLeague?.id]);

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
              <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono">
                {activeLeague ? activeLeague.name : 'Geral'}
              </span>
              {data?.game?.status === 'LIVE' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> AO VIVO
                </span>
              )}
              {data?.game?.status === 'FINISHED' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 size={12} /> TERMINADO
                </span>
              )}
              {data?.game?.status === 'UPCOMING' && !data?.isStarted && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock size={12} /> APOSTAS SECRETAS
                </span>
              )}
            </div>
            
            <h2 className="text-base font-bold text-white mt-1.5 font-orbitron">
              {data?.game?.home_short} <span className="text-slate-500 font-normal">vs</span> {data?.game?.away_short}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Banner Oficial de Pontuações STRIKER */}
        <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800/70 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold font-orbitron">
              <span className="text-emerald-400">Acerto +3 pts</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400">Erro -1 pt</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-500">Falta -2 pts</span>
            </div>
            <div className="text-[11px] font-bold font-orbitron text-amber-400 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-400" />
              <span>TOP Jornada: +3 pts</span>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Apostas deste jogo: <strong className="text-slate-200 font-mono">{data?.totalBets || 0} palpites</strong></span>
            <span className="text-slate-500">Pontuação processada no apito final</span>
          </div>
        </div>

        {/* Content Body: The 3 Columns */}
        <div className="p-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
              A carregar palpites da liga...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                
                {/* 1. Coluna CASA */}
                <ColumnBlock 
                  title={data.columns.home.title}
                  subTitle="Vitória Casa (1)"
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
                  bets={data.columns.away.bets}
                  count={data.columns.away.count}
                  isLocked={data.isLocked}
                  isWinner={data.game.status === 'FINISHED' && data.game.result === 'AWAY'}
                  status={data.game.status}
                />

              </div>

              {/* Bloco de Jogadores da Liga: Todos apostaram vs Quem não apostou */}
              {data.missingMembers && (
                data.missingMembers.length === 0 ? (
                  <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                      <strong className="text-emerald-300">Presença 100%:</strong> Todos os jogadores desta liga colocaram a sua aposta!
                    </p>
                  </div>
                ) : (
                  <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                        <AlertCircle size={15} className="text-amber-400 shrink-0" />
                        <span>
                          {data.missingMembers.length === 1 
                            ? '1 jogador não colocou aposta' 
                            : `${data.missingMembers.length} jogadores não colocaram aposta`}
                        </span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-mono font-bold">
                        (-2 pts no apito final)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {data.missingMembers.map(m => (
                        <div 
                          key={m.id} 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-amber-500/40 text-[11px] shadow-sm"
                        >
                          <span className="text-xs">{m.avatar || '👤'}</span>
                          <span className="font-semibold text-slate-200">{m.name.split(' ')[0]}</span>
                          <span className="font-bold text-rose-400 font-orbitron text-[10px] ml-1.5">
                            -2 pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Informação de encerramento / apito final */}
              <div className="mt-3 text-center text-[10px] text-slate-400">
                {data.game.status === 'FINISHED' ? (
                  <span>🏆 Jogo concluído • Pontuações oficiais (+3, -1 ou -2 pts) creditadas no campeonato</span>
                ) : (
                  <span>⚡ Jogo a decorrer • Pontuações são atribuídas no apito final</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ColumnBlock({ title, subTitle, bets, count, isLocked, isWinner, status }) {
  return (
    <div className={`rounded-xl border flex flex-col p-2.5 transition-all ${
      isWinner 
        ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
        : 'bg-slate-900/60 border-slate-800'
    }`}>
      <div className="text-center pb-2 border-b border-slate-800">
        <div className="text-[11px] font-bold text-white truncate tracking-wide font-orbitron" title={title}>
          {title}
        </div>
        <div className="text-[9px] text-slate-400">{subTitle}</div>
        
        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-200 font-orbitron">
          {count} <span className="text-[9px] text-slate-400 font-normal">{count === 1 ? 'aposta' : 'apostas'}</span>
        </div>

        {isWinner && (
          <div className="mt-1 text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center justify-center gap-1">
            <CheckCircle2 size={12} /> VENCEDOR
          </div>
        )}
      </div>

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
          bets.map((b) => {
            const hasWon = Number(b.net_points) > 0;

            return (
              <div 
                key={b.id}
                className={`p-1.5 rounded-lg border text-left flex items-center justify-between text-[11px] ${
                  hasWon 
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200' 
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs shrink-0">{b.user_avatar || '👤'}</span>
                  <span className="truncate font-medium text-[10px] text-slate-200" title={b.user_name}>
                    {b.user_name.split(' ')[0]}
                  </span>
                </div>

                <div className="shrink-0 text-right font-orbitron font-bold text-[10px]">
                  {status === 'FINISHED' ? (
                    hasWon ? (
                      <span className="text-emerald-400">
                        +3 pts
                      </span>
                    ) : (
                      <span className="text-rose-400">
                        -1 pt
                      </span>
                    )
                  ) : (
                    <span className="text-cyan-400/80 font-mono text-[9px] font-normal">
                      em jogo
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
