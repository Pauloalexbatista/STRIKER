import React, { useState } from 'react';
import { simLockGame, simSettleGame, simResetGame } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Zap, Play, CheckCircle2, RotateCcw, X, ShieldAlert } from 'lucide-react';

export function SimPanel({ isOpen, onClose, onRefreshGames }) {
  const { refreshUsers } = useTheme();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleLock = async (gameId) => {
    try {
      setLoading(true);
      await simLockGame(gameId);
      setFeedback(`Apito Inicial dado no jogo ${gameId}! Apostas bloqueadas e reveladas.`);
      await refreshUsers();
      if (onRefreshGames) onRefreshGames();
    } catch (e) {
      setFeedback('Erro ao dar apito inicial.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (gameId, homeScore, awayScore) => {
    try {
      setLoading(true);
      await simSettleGame(gameId, homeScore, awayScore);
      setFeedback(`Resultado ${homeScore}-${awayScore} registado no jogo ${gameId}! Pote distribuído com sucesso.`);
      await refreshUsers();
      if (onRefreshGames) onRefreshGames();
    } catch (e) {
      setFeedback('Erro ao finalizar jogo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (gameId) => {
    try {
      setLoading(true);
      await simResetGame(gameId);
      setFeedback(`Jogo ${gameId} reposto para UPCOMING.`);
      await refreshUsers();
      if (onRefreshGames) onRefreshGames();
    } catch (e) {
      setFeedback('Erro ao reiniciar jogo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0b0e17] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl safe-bottom overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white font-orbitron">Painel de Simulação</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed">
            Permite testar ao vivo o fecho de apostas, a revelação na gaveta das 3 colunas e a distribuição dos potes de pontos (Economia base 0.00):
          </p>

          {feedback && (
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Test Jogo 1: SCP vs SCB */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Sporting CP vs SC Braga (g1)</span>
              <span className="text-[10px] text-amber-400 font-mono">UPCOMING</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={loading}
                onClick={() => handleLock('g1')}
                className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Play size={12} /> Apito Inicial (LIVE)
              </button>
              <button
                disabled={loading}
                onClick={() => handleReset('g1')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <RotateCcw size={12} /> Repor UPCOMING
              </button>
            </div>
          </div>

          {/* Test Jogo 2: SLB vs FCP */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">SL Benfica vs FC Porto (g2)</span>
              <span className="text-[10px] text-rose-400 font-mono">LIVE (Em Directo)</span>
            </div>
            
            <div className="text-[11px] text-slate-400">Apito Final (Registar Resultado):</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                disabled={loading}
                onClick={() => handleSettle('g2', 2, 1)}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold active:scale-95"
              >
                Benfica 2-1
              </button>
              <button
                disabled={loading}
                onClick={() => handleSettle('g2', 1, 1)}
                className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold active:scale-95"
              >
                Empate 1-1
              </button>
              <button
                disabled={loading}
                onClick={() => handleSettle('g2', 0, 2)}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold active:scale-95"
              >
                Porto 0-2
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
