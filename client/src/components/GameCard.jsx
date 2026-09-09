import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Lock, CheckCircle2 } from 'lucide-react';
import { submitPrediction } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export function GameCard({ game, activeLeague, onOpenReport, onPredictionUpdated }) {
  const { currentUser } = useTheme();
  const [timeLeft, setTimeLeft] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userChoice, setUserChoice] = useState(game.user_prediction);

  useEffect(() => {
    setUserChoice(game.user_prediction);
  }, [game.user_prediction]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const kickoff = new Date(game.kickoff_time).getTime();
      const diff = kickoff - now;

      if (game.status !== 'UPCOMING' || diff <= 0) {
        setIsLocked(true);
        if (game.status === 'LIVE') setTimeLeft('EM DIRECTO');
        else if (game.status === 'FINISHED') setTimeLeft('TERMINADO');
        else setTimeLeft('APITO INICIAL');
        return;
      }

      setIsLocked(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h`);
      } else {
        setTimeLeft(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [game.kickoff_time, game.status]);

  const handleSelectChoice = async (choice) => {
    if (isLocked || submitting || !currentUser || !activeLeague) return;
    try {
      setSubmitting(true);
      setUserChoice(choice);
      await submitPrediction(currentUser.id, game.id, choice, activeLeague.id);
      if (onPredictionUpdated) onPredictionUpdated();
    } catch (err) {
      console.error('Error submitting prediction:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const isLive = game.status === 'LIVE';
  const isFinished = game.status === 'FINISHED';
  const totalBets = game.league_total_bets || 0;

  return (
    <div className="bg-[#0b0e17] rounded-2xl border border-slate-800/90 p-3.5 shadow-xl transition-all relative overflow-hidden">
      
      {/* Top Match Info & Countdown */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            J{game.round}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {new Date(game.kickoff_time).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Countdown or Status Badge */}
          <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-orbitron flex items-center gap-1 ${
            isLive 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' 
              : isFinished 
              ? 'bg-slate-800 text-slate-400 border border-slate-700' 
              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
                <Clock size={12} className="text-amber-400" />
                <span>{timeLeft}</span>
              </>
            )}
          </div>

          {/* 3-Column Report Button */}
          <button
            onClick={() => onOpenReport(game.id)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 active:scale-90 transition-all flex items-center gap-1"
            title="Abrir Relatório da Liga"
          >
            <BarChart3 size={15} className="text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Clubs & Score Display */}
      <div className="py-3 flex items-center justify-between px-1">
        
        {/* Home Club */}
        <div className="flex-1 text-left">
          <div className="text-sm font-black font-orbitron text-white truncate" title={game.home_name}>
            {game.home_short}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Casa</span>
        </div>

        {/* Center: Live / Final Score or VS */}
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

        {/* Away Club */}
        <div className="flex-1 text-right">
          <div className="text-sm font-black font-orbitron text-white truncate" title={game.away_name}>
            {game.away_short}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Fora</span>
        </div>
      </div>

      {/* Direct Prediction Buttons: [ HOME ] [ EMPATE ] [ AWAY ] */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        
        <BetButton
          label={game.home_short}
          code="1"
          isSelected={userChoice === 'HOME'}
          isLocked={isLocked || !activeLeague}
          isCorrect={isFinished && game.result === 'HOME'}
          isWrong={isFinished && userChoice === 'HOME' && game.result !== 'HOME'}
          onClick={() => handleSelectChoice('HOME')}
        />

        <BetButton
          label="EMPATE"
          code="X"
          isSelected={userChoice === 'DRAW'}
          isLocked={isLocked || !activeLeague}
          isCorrect={isFinished && game.result === 'DRAW'}
          isWrong={isFinished && userChoice === 'DRAW' && game.result !== 'DRAW'}
          onClick={() => handleSelectChoice('DRAW')}
        />

        <BetButton
          label={game.away_short}
          code="2"
          isSelected={userChoice === 'AWAY'}
          isLocked={isLocked || !activeLeague}
          isCorrect={isFinished && game.result === 'AWAY'}
          isWrong={isFinished && userChoice === 'AWAY' && game.result !== 'AWAY'}
          onClick={() => handleSelectChoice('AWAY')}
        />

      </div>

      {/* Prediction Feedback & League Pool */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
        <div className="text-slate-400 flex items-center gap-1">
          {userChoice ? (
            <>
              <span>Teu palpite:</span>
              <span className="font-bold text-slate-200">
                {userChoice === 'HOME' ? game.home_short : userChoice === 'AWAY' ? game.away_short : 'EMPATE'}
              </span>
            </>
          ) : (
            <span className="text-amber-400/80 font-medium">Sem aposta registada</span>
          )}
        </div>

        {/* Pool for this league */}
        <div className="text-slate-400 font-mono text-[10px]">
          Pote: <span className="font-bold text-amber-400 font-orbitron">{totalBets}.00 pts</span> ({totalBets} apostas)
        </div>
      </div>

    </div>
  );
}

function BetButton({ label, code, isSelected, isLocked, isCorrect, isWrong, onClick }) {
  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={onClick}
      className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center transition-all relative ${
        isCorrect 
          ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]' 
          : isWrong
          ? 'bg-rose-950/30 border-rose-600/60 text-slate-400 line-through'
          : isSelected
          ? 'bg-slate-800 border-amber-400 text-white shadow-[0_0_12px_rgba(251,191,36,0.3)]'
          : isLocked
          ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
          : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-700/80 text-slate-200 active:scale-95 cursor-pointer'
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide truncate max-w-full">
        {label}
      </span>
      <span className="text-[9px] font-mono text-slate-400 font-semibold">
        ({code})
      </span>

      {isSelected && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
      )}
    </button>
  );
}
