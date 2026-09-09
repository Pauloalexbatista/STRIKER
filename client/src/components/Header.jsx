import React, { useState } from 'react';
import { useTheme, CLUB_THEMES } from '../contexts/ThemeContext';
import { Trophy, Sliders, Users, Shield, Zap } from 'lucide-react';

export function Header({ onOpenLeaderboard, onOpenSim }) {
  const { currentUser, users, switchUser, activeTheme, changeFavoriteClub } = useTheme();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);

  const balance = currentUser ? Number(currentUser.balance).toFixed(2) : '0.00';
  const isPositive = Number(balance) > 0;
  const isNegative = Number(balance) < 0;

  return (
    <header className="sticky top-0 z-30 bg-[#06070b]/90 backdrop-blur-md border-b border-slate-800/80 safe-top px-3 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Brand & Club Badge */}
        <div className="flex items-center gap-2">
          <div 
            onClick={() => setShowClubModal(true)}
            className="w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center text-xl cursor-pointer transition-all active:scale-95 shadow-lg"
            style={{ borderColor: activeTheme.primary, boxShadow: `0 0 12px ${activeTheme.glow}` }}
            title="Alterar Clube Favorito"
          >
            {activeTheme.badge}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-orbitron text-lg font-black tracking-wider text-white flex items-center">
                STRIKER
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Portal <span className="text-slate-300">testeweb.site</span>
            </p>
          </div>
        </div>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-2">
          {/* Balance Pill */}
          <div 
            onClick={() => setShowUserModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 cursor-pointer active:scale-95 transition-all shadow-inner"
          >
            <span className="text-xs">{currentUser?.avatar || '⚽'}</span>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block -mb-1 leading-tight">SALDO</span>
              <span className={`text-xs font-bold font-orbitron ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-200'
              }`}>
                {isPositive ? `+${balance}` : balance} <span className="text-[10px] font-normal text-slate-400">pts</span>
              </span>
            </div>
          </div>

          {/* Ranking Button */}
          <button
            onClick={onOpenLeaderboard}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 active:scale-90 transition-all"
            title="Classificação & Top da Jornada"
          >
            <Trophy size={18} />
          </button>

          {/* Sim / Admin Panel */}
          <button
            onClick={onOpenSim}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-cyan-400 active:scale-90 transition-all"
            title="Simulador de Jogos & Apitos"
          >
            <Zap size={18} />
          </button>
        </div>
      </div>

      {/* User Switcher Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-4 text-left shadow-2xl safe-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                Mudar de Utilizador
              </h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Fechar
              </button>
            </div>

            <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    switchUser(u.id);
                    setShowUserModal(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                    currentUser?.id === u.id 
                      ? 'bg-slate-800/90 border-emerald-500/60 shadow-md' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{u.avatar}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">Clube: {u.favorite_club}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold font-orbitron ${
                    Number(u.balance) > 0 ? 'text-emerald-400' : Number(u.balance) < 0 ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {Number(u.balance) > 0 ? `+${Number(u.balance).toFixed(2)}` : Number(u.balance).toFixed(2)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Club Theme Switcher Modal */}
      {showClubModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-4 text-left shadow-2xl safe-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                Cores do Teu Clube
              </h3>
              <button 
                onClick={() => setShowClubModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Fechar
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-3">
              A app adapta dinamicamente as cores e destaques visuais ao teu clube do coração:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CLUB_THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => {
                    changeFavoriteClub(key);
                    setShowClubModal(false);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                    activeTheme.short === t.short 
                      ? 'bg-slate-800 shadow-lg' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ borderColor: activeTheme.short === t.short ? t.primary : undefined }}
                >
                  <span className="text-2xl">{t.badge}</span>
                  <span className="text-xs font-bold text-white">{t.name}</span>
                  <div className="w-8 h-1.5 rounded-full mt-1" style={{ backgroundColor: t.primary }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
