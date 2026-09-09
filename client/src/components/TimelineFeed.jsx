import React, { useEffect, useState } from 'react';
import { GameCard } from './GameCard';
import { fetchGames } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronLeft, ChevronRight, Calendar, RotateCw, Plus, Trophy } from 'lucide-react';

export function TimelineFeed({ activeLeague, onOpenReport, onOpenLeagueModal }) {
  const { currentUser } = useTheme();
  const [round, setRound] = useState(6); // Matchday 3 (actual real matchday from API)
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGames = async () => {
    try {
      setLoading(true);
      const data = await fetchGames(round, currentUser?.id || '', activeLeague?.id || '');
      setGames(data);
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, [round, currentUser?.id, activeLeague?.id]);

  const handlePredictionUpdated = () => {
    loadGames();
  };

  return (
    <div className="max-w-md mx-auto px-3 py-3 space-y-3">
      
      {/* If user has no active league */}
      {!activeLeague && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/50 text-center space-y-2.5 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
          <Trophy size={28} className="text-amber-400 mx-auto" />
          <h3 className="text-sm font-black font-orbitron text-white">
            Nenhum Campeonato Ativo
          </h3>
          <p className="text-xs text-slate-300">
            Para começares a apostar e veres os potes, cria o teu primeiro campeonato ou entra com um código de convite!
          </p>
          <button
            type="button"
            onClick={onOpenLeagueModal}
            className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-orbitron uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={14} /> Criar ou Entrar numa Liga
          </button>
        </div>
      )}

      {/* Jornada Selector & Controls */}
      <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <button
          disabled={round <= 1}
          onClick={() => setRound(r => Math.max(1, r - 1))}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white active:scale-90 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Liga Portugal
          </div>
          <div className="text-sm font-black font-orbitron text-white flex items-center gap-1.5 justify-center">
            <Calendar size={14} className="text-amber-400" />
            Jornada {round} de 34
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={loadGames}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-90 transition-all cursor-pointer"
            title="Atualizar Jogos"
          >
            <RotateCw size={16} className={loading ? 'animate-spin text-amber-400' : ''} />
          </button>
          
          <button
            disabled={round >= 34}
            onClick={() => setRound(r => Math.min(34, r + 1))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white active:scale-90 transition-all cursor-pointer"
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
              activeLeague={activeLeague}
              onOpenReport={onOpenReport}
              onPredictionUpdated={handlePredictionUpdated}
            />
          ))}
        </div>
      )}

    </div>
  );
}
