import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme, hexToRgba } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { TimelineFeed } from './components/TimelineFeed';
import { ThreeColumnDrawer } from './components/ThreeColumnDrawer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LoginModal } from './components/LoginModal';
import { LeagueModal } from './components/LeagueModal';
import { RulesModal } from './components/RulesModal';
import { SponsorBanner } from './components/SponsorBanner';
import { fetchMyLeagues } from './services/api';
import { Smartphone } from 'lucide-react';

function StrikerApp() {
  const { currentUser, login, activeTheme } = useTheme();
  const [activeReportGameId, setActiveReportGameId] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

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

      if (userLeagues.length > 0) {
        if (!activeLeague || !userLeagues.some(l => l.id === activeLeague.id)) {
          setActiveLeague(userLeagues[0]);
        } else {
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
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('liga');
      if (inviteCode) {
        setShowLeagueModal(true);
      }
    }
  }, [currentUser?.id]);

  return (
    <div className="min-h-screen bg-[#06070b] text-slate-100 flex flex-col portal-grid select-none">
      <Header
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        activeLeague={activeLeague}
        onOpenLeagueModal={() => setShowLeagueModal(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenRules={() => setShowRules(true)}
      />

      <div className="max-w-md mx-auto w-full px-3 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse transition-colors duration-500" style={{ backgroundColor: activeTheme?.primary || '#00d166', boxShadow: `0 0 10px ${activeTheme?.primary || '#00d166'}` }} />
          <span className="font-semibold text-slate-300">striker.testeweb.site</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Smartphone size={12} className="text-amber-400" />
          <span>{activeLeague ? activeLeague.name : 'Campeonatos'}</span>
        </div>
      </div>

      <main className="flex-1 pb-24">
        <TimelineFeed
          key={feedKey}
          activeLeague={activeLeague}
          onOpenReport={(gameId) => setActiveReportGameId(gameId)}
          onOpenLeagueModal={() => setShowLeagueModal(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      </main>

      {activeReportGameId && (
        <ThreeColumnDrawer
          gameId={activeReportGameId}
          activeLeague={activeLeague}
          onClose={() => setActiveReportGameId(null)}
        />
      )}

      <LeaderboardModal
        isOpen={showLeaderboard}
        activeLeague={activeLeague}
        onClose={() => setShowLeaderboard(false)}
      />

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

      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />

      {/* Footer Fixo de Publicidade: Patrocinio da jornada */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#06070b]/95 backdrop-blur-md border-t border-slate-800/80 px-3 py-2 safe-bottom shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
        <div className="max-w-md mx-auto">
          <div className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1 flex items-center justify-between">
            <span>Patrocinio da jornada:</span>
            <span className="text-[8px] font-mono" style={{ color: activeTheme?.primary || '#ffd700' }}>OFICIAL</span>
          </div>
          <div 
            className="h-10 rounded-xl border border-dashed flex items-center justify-center transition-all px-3 cursor-pointer select-none"
            style={{ 
              borderColor: `${hexToRgba(activeTheme?.primary, 0.4)}`, 
              backgroundColor: `${hexToRgba(activeTheme?.primary, 0.05)}`,
              color: activeTheme?.primary || '#ffd700'
            }}
          >
            <span className="text-[11px] font-orbitron font-bold opacity-80 tracking-wider truncate">
              Espa&ccedil;o Reservado para Patrocinador Oficial
            </span>
          </div>
        </div>
      </footer>

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


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('STRIKER Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06070b] text-white p-6 flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-3">&#9888;&#65039;</div>
          <h2 className="text-base font-bold font-orbitron text-amber-400 mb-2">A carregar o STRIKER...</h2>
          <p className="text-xs text-slate-400 mb-4 font-mono max-w-xs">{this.state.error?.message || 'A reiniciar interface'}</p>
          <button
            onClick={async () => {
              localStorage.clear();
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) { await reg.unregister(); }
              }
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              }
              window.location.reload(true);
            }}
            className="px-5 py-2.5 bg-amber-400 text-black font-bold text-xs rounded-xl font-orbitron active:scale-95 shadow-lg cursor-pointer"
          >
            Limpar Cache &amp; Reiniciar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StrikerApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}