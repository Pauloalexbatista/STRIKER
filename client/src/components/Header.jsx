import React, { useState } from 'react';
import { useTheme, CLUB_THEMES, hexToRgba } from '../contexts/ThemeContext';
import { Trophy, Shield, LogOut, Check, ChevronDown, Share2, HelpCircle } from 'lucide-react';

export function Header({ onOpenLeaderboard, activeLeague, onOpenLeagueModal, onOpenRules }) {
  const { currentUser, activeTheme, changeFavoriteClub, logout } = useTheme();
  const [showClubModal, setShowClubModal] = useState(false);

  const balance = activeLeague ? Number(activeLeague.user_balance || 0).toFixed(2) : '0.00';
  const isPositive = Number(balance) > 0;
  const isNegative = Number(balance) < 0;
  const rawAvatar = currentUser?.avatar || '';
  const cleanAvatar = (rawAvatar && !rawAvatar.includes('Ãƒ') && !rawAvatar.includes('Ã°') && rawAvatar.length <= 4) ? rawAvatar : (activeTheme?.badge || '\u{1F981}');

  return (
    <header className="sticky top-0 z-40 bg-[#06070b]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 shadow-lg safe-top">
      <div className="max-w-md mx-auto space-y-2">
        
        {/* Top Row: Brand + Club Theme Selector + Saldo + Actions */}
        <div className="flex items-center justify-between">
          
          {/* Logo & User Greeting */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowClubModal(true)}
              className="w-9 h-9 rounded-xl border flex items-center justify-center text-lg active:scale-95 transition-all shadow-inner bg-slate-900/90 cursor-pointer"
              style={{ borderColor: activeTheme.primary, boxShadow: `0 0 10px ${activeTheme.glow}` }}
              title="Mudar cores do teu clube"
            >
              {activeTheme.badge}
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-orbitron text-base font-black tracking-wider text-white flex items-center">
                  STRIKER
                </h1>
                <span className="text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded border transition-all duration-300" style={{ backgroundColor: `${hexToRgba(activeTheme?.primary, 0.15)}`, borderColor: `${hexToRgba(activeTheme?.primary, 0.45)}`, color: activeTheme.primary }}>
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>Ol&aacute;,</span>
                <span className="text-white font-bold">{currentUser?.name || 'Visitante'}</span>
              </div>
            </div>
          </div>

          {/* Right Actions: Balance, Trophy, Rules & Logout */}
          <div className="flex items-center gap-1.5">
            {/* Points Pill: direto, sem avatar duplicado, valores inteiros, maior destaque */}
            <div className="flex items-center px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-800 shadow-inner">
              <span className={`text-sm font-black font-orbitron tracking-wide ${
                isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-100'
              }`}>
                {isPositive ? `+${pointsInt}` : pointsInt} <span className="text-[10px] font-normal text-slate-400 font-sans ml-0.5">Pts</span>
              </span>
            </div>

            {/* Ranking (Trophy) */}
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 active:scale-90 transition-all cursor-pointer"
              style={{ color: activeTheme.primary }}
              title="Classifica&ccedil;&otilde;es &amp; Ranking"
            >
              <Trophy size={16} />
            </button>

            {/* Rules ? */}
            <button
              type="button"
              onClick={onOpenRules}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 active:scale-90 transition-all cursor-pointer"
              style={{ color: activeTheme?.primary }}
              title="Regras do Jogo"
            >
              <HelpCircle size={15} />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-rose-400 active:scale-90 transition-all cursor-pointer"
              title="Mudar de Jogador / Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Bottom Row: Active League Selector & Direct WhatsApp Invite */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={onOpenLeagueModal}
            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 flex items-center justify-between transition-all group active:scale-99 shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Trophy size={14} className="text-amber-400 shrink-0" />
              <div className="text-left truncate">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block -mb-0.5">Campeonato Ativo</span>
                <span className="text-xs font-bold truncate font-orbitron transition-colors duration-300" style={{ color: activeTheme.primary }}>
                  {activeLeague ? activeLeague.name : 'Escolher Campeonato'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeLeague && (
                <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  #{activeLeague.code}
                </span>
              )}
              <ChevronDown size={14} className="text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </button>

          {activeLeague && (
            <button
              type="button"
              onClick={() => {
                const text = 'Junta-te a minha Liga ' + activeLeague.name + ' no STRIKER!\nCodigo: ' + activeLeague.code + '\nEntra aqui: https://striker.testeweb.site?liga=' + activeLeague.code;
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Convidar Amigos e Fam\u{00ED}lia via WhatsApp"
            >
              <Share2 size={13} />
              <span>Convidar</span>
            </button>
          )}
        </div>

      </div>

      {/* Club Theme Selector Modal */}
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
                <Shield size={16} style={{ color: activeTheme.primary }} />
                Cores do Teu Clube
              </h3>
              <button 
                onClick={() => setShowClubModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                &times;
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mt-2 mb-4">
              Escolhe o teu clube para personalizar as cores n&eacute;on de toda a aplica&ccedil;&atilde;o:
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