import React, { useState } from 'react';
import { loginUser } from '../services/api';
import { Shield, KeyRound, User, ArrowRight } from 'lucide-react';
import { CLUB_THEMES } from '../contexts/ThemeContext';

export function LoginModal({ isOpen, onLoginSuccess }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [favoriteClub, setFavoriteClub] = useState('SCP');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !pin.trim()) {
      setError('Por favor preenche o nome e o teu PIN');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await loginUser(name.trim(), pin.trim(), favoriteClub);
      localStorage.setItem('striker_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0e17] border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-2xl flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            ⚽
          </div>
          <h2 className="text-xl font-black font-orbitron text-white tracking-wide">
            ENTRAR NO STRIKER
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Se for a tua primeira vez, a conta é criada com 0.00 pts!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-amber-400" />
              O Teu Nome / Alcunha:
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="ex: Paulo, Rui, Maria..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <KeyRound size={13} className="text-amber-400" />
              PIN Secreto (4 dígitos):
            </label>
            <input
              type="password"
              required
              maxLength={8}
              placeholder="ex: 1234"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 font-mono tracking-widest"
            />
          </div>

          {/* Clube */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Shield size={13} className="text-emerald-400" />
              Clube do Coração:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(CLUB_THEMES).map(([key, t]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setFavoriteClub(key)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    favoriteClub === key 
                      ? 'bg-slate-800 border-amber-400 text-white shadow-md' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">{t.badge}</span>
                  <span className="truncate text-[11px]">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black font-orbitron text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.35)] active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? 'A entrar...' : 'Entrar no Jogo'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
