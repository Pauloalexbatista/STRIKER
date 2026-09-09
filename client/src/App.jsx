import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { TimelineFeed } from './components/TimelineFeed';
import { ThreeColumnDrawer } from './components/ThreeColumnDrawer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LoginModal } from './components/LoginModal';
import { LeagueModal } from './components/LeagueModal';
import { fetchMyLeagues } from './services/api';
import { Smartphone } from 'lucide-react';

function StrikerApp() {
  const { currentUser, login } = useTheme();
  const [activeReportGameId, setActiveReportGameId] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  
  // Ligas
  const [leagues, setLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [createdCount, setCreatedCount] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [feedKey, setFeedKey] = useState(0);

  const loadLeagues = async () => {
    if (!currentUser) return;
    try {
      const data = await fetchMyLeagues(currentUser.id);
      const userLeagues = data.leagues || [];
      setLeagues(userLeagues);
      setCreatedCount(data.createdCount || 0);
      setMaxAllowed(data.maxAllowed || 3);

      // Se ainda não temos liga ativa selecionada
      if (userLeagues.length > 0) {
        if (!activeLeague || !userLeagues.some(l => l.id === activeLeague.id)) {
          setActiveLeague(userLeagues[0]);
        } else {
          // Atualizar dados da liga ativa (ex: saldo)
          const updated = userLeagues.find(l => l.id === activeLeague.id);
          if (updated) setActiveLeague(updated);
        }
      } else {
        setActiveLeague(null);
      }
    } catch (err) {
      console.error('Error fetching leagues:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadLeagues();

      // Verificar se o utilizador abriu através de link de convite ?liga=CODIGO
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('liga');
      if (inviteCode) {
        setShowLeagueModal(true);
      }
    }
  }, [currentUser?.id]);

  return (
    <div className="min-h-screen bg-[#06070b] text-slate-100 flex flex-col portal-grid select-none">
      
      {/* Top Header com Seletor de Liga */}
      <Header 
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        activeLeague={activeLeague}
        onOpenLeagueModal={() => setShowLeagueModal(true)}
      />

      {/* Breadcrumb Info */}
      <div className="max-w-md mx-auto w-full px-3 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="font-semibold text-slate-300">striker.testeweb.site</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Smartphone size={12} className="text-amber-400" />
          <span>{activeLeague ? activeLeague.name : 'Campeonatos'}</span>
        </div>
      </div>

      {/* Main Feed with all Games */}
      <main className="flex-1 pb-8">
        <TimelineFeed 
          key={feedKey}
          activeLeague={activeLeague}
          onOpenReport={(gameId) => setActiveReportGameId(gameId)}
          onOpenLeagueModal={() => setShowLeagueModal(true)}
        />
      </main>

      {/* 3-Column Report Drawer da Liga */}
      {activeReportGameId && (
        <ThreeColumnDrawer
          gameId={activeReportGameId}
          activeLeague={activeLeague}
          onClose={() => setActiveReportGameId(null)}
        />
      )}

      {/* Rankings Modal da Liga Ativa */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        activeLeague={activeLeague}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Gestor de Ligas & Convites */}
      <LeagueModal
        isOpen={showLeagueModal}
        onClose={() => setShowLeagueModal(false)}
        leagues={leagues}
        activeLeague={activeLeague}
        createdCount={createdCount}
        maxAllowed={maxAllowed}
        userId={currentUser?.id}
        onSelectLeague={(league) => {
          setActiveLeague(league);
          setFeedKey(k => k + 1);
        }}
        onRefreshLeagues={loadLeagues}
      />

      {/* Login / Register Modal para novos jogadores */}
      <LoginModal
        isOpen={!currentUser}
        onLoginSuccess={(user) => {
          login(user);
          setFeedKey(k => k + 1);
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StrikerApp />
    </ThemeProvider>
  );
}
