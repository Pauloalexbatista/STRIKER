import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { TimelineFeed } from './components/TimelineFeed';
import { ThreeColumnDrawer } from './components/ThreeColumnDrawer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { LoginModal } from './components/LoginModal';
import { Smartphone } from 'lucide-react';

function StrikerApp() {
  const { currentUser, login } = useTheme();
  const [activeReportGameId, setActiveReportGameId] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#06070b] text-slate-100 flex flex-col portal-grid select-none">
      
      {/* Top Header */}
      <Header 
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* Breadcrumb Info */}
      <div className="max-w-md mx-auto w-full px-3 pt-3 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="font-semibold text-slate-300">striker.testeweb.site</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Smartphone size={12} className="text-amber-400" />
          <span>Liga Familiar</span>
        </div>
      </div>

      {/* Main Feed with all Games */}
      <main className="flex-1 pb-8">
        <TimelineFeed 
          key={feedKey}
          onOpenReport={(gameId) => setActiveReportGameId(gameId)}
        />
      </main>

      {/* 3-Column Report Drawer */}
      {activeReportGameId && (
        <ThreeColumnDrawer
          gameId={activeReportGameId}
          onClose={() => setActiveReportGameId(null)}
        />
      )}

      {/* Rankings Modal (opened exclusively via Trophy icon in header) */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Login / Register Modal for family members entering the site */}
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
