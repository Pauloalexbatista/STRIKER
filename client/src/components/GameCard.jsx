import { useState, useEffect, useCallback } from 'react';
import { Clock, Lock, CheckCircle2, BarChart3 } from 'lucide-react';
import { useTheme, hexToRgba } from '../contexts/ThemeContext';
import { submitPrediction, fetchGameReport } from '../services/api';

export function GameCard({ game, activeLeague, onOpenReport }) {
  const { activeTheme, currentUser } = useTheme();
  const [userChoice, setUserChoice] = useState(null);
  const [totalBets, setTotalBets] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const updateStatus = useCallback(() => {
    const now = Date.now();
    const kickoff = new Date(game.kickoff_time).getTime();
    const diff = kickoff - now;
    const finished = game.status === 'FINISHED';
    const live = game.status === 'LIVE' || (!finished && diff <= 0);

    setIsFinished(finished);
    setIsLive(live);
    setIsLocked(live || finished);

    if (finished) {
      setTimeLeft('TERMINADO');
    } else if (live) {
      setTimeLeft('AO VIVO');
    } else if (diff > 0) {
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}m`);
    }
  }, [game.kickoff_time, game.status]);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  // Initialize userChoice from game data (already fetched by parent)
  useEffect(() => {
    const map = { HOME: 'HOME', DRAW: 'DRAW', AWAY: 'AWAY' };
    setUserChoice(game.user_prediction ? map[game.user_prediction] || game.user_prediction : null);
  }, [game.user_prediction]);

  // Fetch total bets count for this game in this league
  useEffect(() => {
    if (!activeLeague) return;
    fetchGameReport(game.id, activeLeague.id).then(data => {
      setTotalBets(data.totalBets ?? 0);
    }).catch(() => {});
  }, [game.id, activeLeague?.id]);

  const handleSelectChoice = async (choice) => {
    if (isLocked || !activeLeague) return;
    const prev = userChoice;
    setUserChoice(choice);
    try {
      await submitPrediction(currentUser.id, game.id, choice, activeLeague.id);
      const data = await fetchGameReport(game.id, activeLeague.id);
      setTotalBets(data.totalBets ?? 0);
      // userChoice already set optimistically above
    } catch {
      setUserChoice(prev);
    }
  };

  return (
    <div
      className="bg-[#0b0e17]/90 border border-slate-800/60 rounded-2xl px-3.5 pt-2.5 pb-3 shadow-lg relative overflow-hidden"
      style={{ boxShadow: `0 0 0 1px ${hexToRgba(activeTheme?.primary, 0.06)}, 0 4px 24px rgba(0,0,0,0.45)` }}
    >
      {/* Top Row: Round + Date + Status + Report */}
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 text-slate-300 font-bold font-orbitron px-1.5 py-0.5 rounded text-[9px]">
            J{game.round}
          </span>
          <span>
            {new Date(game.kickoff_time).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })},{' '}
            {new Date(game.kickoff_time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold font-orbitron text-[9px] ${
            isLive
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
              : isFinished
              ? 'bg-slate-800 text-slate-400 border border-slate-700'
              : 'text-white border'
          }`}>
            {isLive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>{timeLeft}</span>
              </>
            ) : isFinished ? (
              <>
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>{timeLeft}</span>
              </>
            ) : (
              <>
                <Clock size={12} style={{ color: activeTheme?.primary || '#ffd700' }} />
                <span>{timeLeft}</span>
              </>
            )}
          </div>

          {/* Report button: only LIVE or FINISHED */}
          {(isLive || isFinished) ? (
            <button
              type="button"
              onClick={() => onOpenReport(game.id)}
              className="px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/80 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold font-orbitron shadow-[0_0_8px_rgba(6,182,212,0.2)]"
              title="Ver Apostas"
            >
              <BarChart3 size={13} />
              <span>Ver Palpites</span>
            </button>
          ) : (
            <div
              className="p-1 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-600 flex items-center gap-1 text-[10px]"
              title="Apostas secretas ate ao apito inicial"
            >
              <Lock size={12} />
            </div>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="py-3 flex items-center justify-between px-1">
        <div className="flex-1 text-left">
          <div className="text-sm font-black font-orbitron text-white truncate" title={game.home_name}>
            {game.home_short}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Casa</span>
        </div>

        <div className="px-3 text-center">
          {isFinished || isLive ? (
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-700 font-orbitron text-lg font-black text-white shadow-inner">
              <span className={game.result === 'HOME' ? 'text-emerald-400' : ''}>{game.home_score ?? 0}</span>
              <span className="text-slate-500 text-sm">-</span>
              <span className={game.result === 'AWAY' ? 'text-emerald-400' : ''}>{game.away_score ?? 0}</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 font-mono">
              VS
            </div>
          )}
        </div>

        <div className="flex-1 text-right">
          <div className="text-sm font-black font-orbitron text-white truncate" title={game.away_name}>
            {game.away_short}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Fora</span>
        </div>
      </div>

      {/* Bet Buttons: 1 / X / 2 only */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <BetButton
          label="1"
          code="HOME"
          isSelected={userChoice === 'HOME'}
          isLocked={isLocked || !activeLeague}
          isCorrect={isFinished && game.result === 'HOME'}
          isWrong={isFinished && userChoice === 'HOME' && game.result !== 'HOME'}
          activeTheme={activeTheme}
          onClick={() => handleSelectChoice('HOME')}
        />
        <BetButton
          label="X"
          code="DRAW"
          isSelected={userChoice === 'DRAW'}
          isLocked={isLocked || !activeLeague}
          isCorrect={isFinished && game.result === 'DRAW'}
          isWrong={isFinished && userChoice === 'DRAW' && game.result !== 'DRAW'}
          activeTheme={activeTheme}
          onClick={() => handleSelectChoice('DRAW')}
        />
        <BetButton
          label="2"
          code="AWAY"
          isSelected={userChoice === 'AWAY'}
          isLocked={isLocked || !activeLeague}
          isCorrect={isFinished && game.result === 'AWAY'}
          isWrong={isFinished && userChoice === 'AWAY' && game.result !== 'AWAY'}
          activeTheme={activeTheme}
          onClick={() => handleSelectChoice('AWAY')}
        />
      </div>

      {/* Footer: only bet count */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
        <div className="text-slate-500 flex items-center gap-1">
          {!isLive && !isFinished && (
            <span className="flex items-center gap-0.5 text-[9px]" title="Ninguem ve os palpites ate ao apito inicial">
              <Lock size={10} className="text-slate-600" />
              <span>Secretas</span>
            </span>
          )}
        </div>
        <div className="text-slate-500 text-[10px]">
          {totalBets} {totalBets === 1 ? 'aposta' : 'apostas'}
        </div>
      </div>
    </div>
  );
}

function BetButton({ label, code, isSelected, isLocked, isCorrect, isWrong, activeTheme, onClick }) {
  const dynamicStyle = isSelected && !isCorrect && !isWrong ? {
    borderColor: activeTheme?.primary || '#ffd700',
    boxShadow: `0 0 16px ${activeTheme?.glow || 'rgba(255,215,0,0.4)'}`,
    backgroundColor: hexToRgba(activeTheme?.primary, 0.12)
  } : {};

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={onClick}
      style={dynamicStyle}
      className={`py-3 px-1 rounded-xl border flex items-center justify-center transition-all relative cursor-pointer ${
        isCorrect
          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
          : isWrong
          ? 'bg-rose-950/30 border-rose-600/60 text-slate-500 line-through'
          : isSelected
          ? 'text-white'
          : isLocked
          ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
          : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-700/80 text-slate-200 active:scale-95'
      }`}
    >
      <span className="text-base font-black font-orbitron tracking-widest">
        {label}
      </span>

      {isSelected && (
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: activeTheme?.primary || '#ffd700',
            boxShadow: `0 0 6px ${activeTheme?.primary || '#ffd700'}`
          }}
        />
      )}
    </button>
  );
}