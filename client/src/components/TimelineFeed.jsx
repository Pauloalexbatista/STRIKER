import React, { useEffect, useState } from 'react';
import { GameCard } from './GameCard';
import { fetchGames } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronLeft, ChevronRight, Calendar, RotateCw } from 'lucide-react';

export function TimelineFeed({ onOpenReport }) {
  const { currentUser, refreshUsers } = useTheme();
  const [round, setRound] = useState(25);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGames = async () => {
    try {
      setLoading(true);
      const data = await fetchGames(round, currentUser?.id || 'u1');
      setGames(data);
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, [round, currentUser?.id]);

  const handlePredictionUpdated = () => {
    loadGames();
    refreshUsers();
  };

  return (
    <div className="max-w-md mx-auto px-3 py-4 space-y-4">
      
      {/* Jornada Selector & Controls */}
      <div className="flex items-center justify-between bg-slate-900/70 p-2 rounded-2xl border border-slate-800">
        <button
          disabled={round <= 1}
          onClick={() => setRound(r => Math.max(1, r - 1))}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white active:scale-90 transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
            Primeira Liga
          </div>
          <div className="text-base font-black font-orbitron text-white flex items-center gap-1.5 justify-center">
            <Calendar size={15} className="text-amber-400" />
            Jornada {round} de 34
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={loadGames}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-90 transition-all"
            title="Actualizar Jogos"
          >
            <RotateCw size={18} className={loading ? 'animate-spin text-amber-400' : ''} />
          </button>
          
          <button
            disabled={round >= 34}
            onClick={() => setRound(r => Math.min(34, r + 1))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white active:scale-90 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Timeline Feed of Game Cards */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-400">A carregar jogos da jornada...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
          Nenhum jogo agendado para esta jornada.
        </div>
      ) : (
        <div className="space-y-3">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onOpenReport={onOpenReport}
              onPredictionUpdated={handlePredictionUpdated}
            />
          ))}
        </div>
      )}

    </div>
  );
}
