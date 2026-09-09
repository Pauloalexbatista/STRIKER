import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { TimelineFeed } from './components/TimelineFeed';
import { ThreeColumnDrawer } from './components/ThreeColumnDrawer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SimPanel } from './components/SimPanel';
import { Shield, Sparkles, Smartphone } from 'lucide-react';

export default function App() {
  const [activeReportGameId, setActiveReportGameId] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  const handleRefreshFeed = () => {
    setFeedKey(k => k + 1);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#06070b] text-slate-100 flex flex-col portal-grid pb-12 select-none">
        
        {/* Top App Header */}
        <Header 
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenSim={() => setShowSim(true)}
        />

        {/* Portal Breadcrumb & Mobile-First Tag */}
        <div className="max-w-md mx-auto w-full px-3 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span className="font-semibold text-slate-300">testeweb.site / STRIKER</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Smartphone size={12} className="text-amber-400" />
            <span>Mobile WebApp (PWA)</span>
          </div>
        </div>

        {/* Main Feed */}
        <main className="flex-1">
          <TimelineFeed 
            key={feedKey}
            onOpenReport={(gameId) => setActiveReportGameId(gameId)}
          />
        </main>

        {/* 3-Column Drawer Modal */}
        {activeReportGameId && (
          <ThreeColumnDrawer
            gameId={activeReportGameId}
            onClose={() => setActiveReportGameId(null)}
          />
        )}

        {/* Leaderboards Modal */}
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
        />

        {/* Simulation Panel */}
        <SimPanel
          isOpen={showSim}
          onClose={() => setShowSim(false)}
          onRefreshGames={handleRefreshFeed}
        />

        {/* Bottom Floating Quick Actions on Mobile */}
        <div className="fixed bottom-3 inset-x-0 z-20 flex justify-center px-4 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl pointer-events-auto">
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 active:scale-95"
            >
              🏆 Rankings
            </button>
            <span className="text-slate-700">|</span>
            <button 
              onClick={() => setShowSim(true)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 active:scale-95"
            >
              ⚡ Simular Apitos
            </button>
          </div>
        </div>

      </div>
    </ThemeProvider>
  );
}
