import React, { useState } from 'react';
import { useTheme, CLUB_THEMES } from '../contexts/ThemeContext';
import { Trophy, Shield, LogOut, Check } from 'lucide-react';

export function Header({ onOpenLeaderboard }) {
  const { currentUser, activeTheme, changeFavoriteClub, logout } = useTheme();
  const [showClubModal, setShowClubModal] = useState(false);

  const balance = currentUser ? Number(currentUser.balance).toFixed(2) : '0.00';
  const isPositive = Number(balance) > 0;
  const isNegative = Number(balance) < 0;

  return (
    <header className="sticky top-0 z-30 bg-[#06070b]/95 backdrop-blur-md border-b border-slate-800/80 safe-top px-3 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Brand & Club Badge (Click to open Club Color Picker) */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setShowClubModal(true)}
            className="w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center text-xl active:scale-95 transition-all shadow-lg cursor-pointer"
            style={{ borderColor: activeTheme.primary, boxShadow: `0 0 12px ${activeTheme.glow}` }}
            title="Mudar cores do teu clube"
          >
            {activeTheme.badge}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-orbitron text-lg font-black tracking-wider text-white flex items-center">
                STRIKER
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                LIGA
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Jogador:</span>
              <span className="text-white font-bold">{currentUser?.name || 'Visitante'}</span>
            </div>
          </div>
        </div>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-2">
          {/* Balance Display Pill (Visual display, no popup!) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
            <span className="text-xs">{currentUser?.avatar || '⚽'}</span>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block -mb-1 leading-tight">SALDO</span>
              <span className={`text-xs font-bold font-orbitron ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-200'
              }`}>
                {isPositive ? `+${balance}` : balance} <span className="text-[9px] font-normal text-slate-400">pts</span>
              </span>
            </div>
          </div>

          {/* Ranking Button (Trophy) */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 active:scale-90 transition-all cursor-pointer"
            title="Classificações & Ranking"
          >
            <Trophy size={18} />
          </button>

          {/* Logout / Switch User */}
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-rose-400 active:scale-90 transition-all cursor-pointer"
            title="Mudar de Jogador / Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Club Theme Selector Modal (PERFECTLY CENTERED in screen) */}
      {showClubModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowClubModal(false)}
        >
          <div 
            className="bg-[#0b0e17] border border-slate-800 rounded-2xl w-full max-w-sm p-5 text-left shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-orbitron">
                <Shield size={16} className="text-amber-400" />
                Cores do Teu Clube
              </h3>
              <button 
                onClick={() => setShowClubModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mt-2 mb-4">
              Escolhe o teu clube para personalizar as cores néon de toda a aplicação:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(CLUB_THEMES).map(([key, t]) => {
                const isSelected = activeTheme.short === t.short;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      changeFavoriteClub(key);
                      setShowClubModal(false);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center relative cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-800/90 shadow-lg' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                    style={{ borderColor: isSelected ? t.primary : undefined }}
                  >
                    <span className="text-2xl">{t.badge}</span>
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    <div 
                      className="w-10 h-1 rounded-full mt-1" 
                      style={{ backgroundColor: t.primary, boxShadow: isSelected ? `0 0 8px ${t.glow}` : 'none' }} 
                    />
                    {isSelected && (
                      <span className="absolute top-2 right-2 text-emerald-400">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
