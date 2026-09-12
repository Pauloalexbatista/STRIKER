import React, { useState } from 'react';
import { Trophy, Plus, KeyRound, Share2, Check, Users, ShieldAlert, Sparkles, X, Trash2, LogOut } from 'lucide-react';
import { createLeague, joinLeague, deleteLeague, leaveLeague } from '../services/api';

export function LeagueModal({ 
  isOpen, 
  onClose, 
  leagues, 
  activeLeague, 
  createdCount, 
  maxAllowed, 
  userId, 
  onSelectLeague, 
  onRefreshLeagues 
}) {
  const [view, setView] = useState('list'); // 'list', 'create', 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    try {
      setLoading(true);
      setError('');
      const res = await createLeague(userId, name.trim(), code.trim());
      await onRefreshLeagues();
      onSelectLeague(res.league);
      setView('list');
      setName('');
      setCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setLoading(true);
      setError('');
      const res = await joinLeague(userId, joinCode.trim());
      await onRefreshLeagues();
      onSelectLeague(res.league);
      setView('list');
      setJoinCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeague = async (league) => {
    const confirmed = window.confirm(
      `Tens a certeza que queres APAGAR o campeonato "${league.name}" (#${league.code})?\n\nEsta ação é irreversível e vai eliminar todas as classificações e palpites desta liga.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(league.id);
      setError('');
      setActionSuccess('');
      await deleteLeague(league.id, userId);
      await onRefreshLeagues();
      setActionSuccess(`Campeonato "${league.name}" apagado com sucesso!`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Erro ao apagar campeonato');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLeaveLeague = async (league) => {
    const confirmed = window.confirm(
      `Tens a certeza que queres SAIR do campeonato "${league.name}" (#${league.code})?`
    );
    if (!confirmed) return;

    try {
      setDeletingId(league.id);
      setError('');
      setActionSuccess('');
      await leaveLeague(league.id, userId);
      await onRefreshLeagues();
      setActionSuccess(`Saíste do campeonato "${league.name}".`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Erro ao sair do campeonato');
    } finally {
      setDeletingId(null);
    }
  };

  const shareLeague = (league) => {
    const text = `⚽ Junta-te à minha Liga '${league.name}' no STRIKER!\n🔑 Código de Convite: ${league.code}\n👉 Entra aqui: https://striker.testeweb.site?liga=${league.code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(league.code);
      setTimeout(() => setCopiedCode(''), 3000);
    }
    // Abrir WhatsApp se disponível
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-[#0b0e17] border border-slate-800 rounded-3xl w-full max-w-sm p-5 text-left shadow-2xl safe-bottom relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white font-orbitron">
              {view === 'list' ? 'Os Teus Campeonatos' : view === 'create' ? 'Criar Campeonato' : 'Entrar com Código'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {actionSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs">
            {actionSuccess}
          </div>
        )}

        {/* 1. LIST VIEW */}
        {view === 'list' && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Ligas criadas por ti: <strong className="text-amber-400 font-mono">{createdCount}/{maxAllowed}</strong></span>
            </div>

            {/* Leagues List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {leagues.length === 0 ? (
                <div className="py-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
                  <Trophy size={28} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Ainda não estás em nenhum campeonato.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Cria o teu primeiro ou entra com um código de convite!</p>
                </div>
              ) : (
                leagues.map(l => {
                  const isActive = activeLeague?.id === l.id;
                  const bal = Number(l.user_balance || 0).toFixed(2);
                  const isPos = Number(bal) > 0;
                  const isNeg = Number(bal) < 0;

                  return (
                    <div 
                      key={l.id}
                      onClick={() => {
                        onSelectLeague(l);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isActive 
                          ? 'bg-slate-800/90 border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.2)]' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold">
                          {isActive ? '🏆' : '⚽'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            {l.name}
                            {isActive && <Check size={12} className="text-emerald-400 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-amber-300 font-bold">#{l.code}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Users size={10} /> {l.total_members} membros
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Balance & Actions (Share & Delete/Leave) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right mr-0.5">
                          <span className={`text-xs font-bold font-orbitron block ${
                            isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-300'
                          }`}>
                            {isPos ? `+${bal}` : bal}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">pts</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareLeague(l);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 active:scale-90 transition-all cursor-pointer"
                          title="Partilhar Convite no WhatsApp"
                        >
                          <Share2 size={13} />
                        </button>

                        {l.creator_id === userId || userId === 'u_paulo' ? (
                          <button
                            type="button"
                            disabled={deletingId === l.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLeague(l);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 border border-rose-500/30 active:scale-90 transition-all cursor-pointer disabled:opacity-40"
                            title="Apagar este campeonato"
                          >
                            <Trash2 size={13} className={deletingId === l.id ? 'animate-pulse' : ''} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={deletingId === l.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveLeague(l);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 border border-slate-700 active:scale-90 transition-all cursor-pointer disabled:opacity-40"
                            title="Sair deste campeonato"
                          >
                            <LogOut size={13} className={deletingId === l.id ? 'animate-pulse' : ''} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {copiedCode && (
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-[11px] text-center">
                Mensagem e código copiados! A abrir WhatsApp...
              </div>
            )}

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={createdCount >= maxAllowed}
                onClick={() => {
                  setError('');
                  setView('create');
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus size={14} /> Criar ({createdCount}/{maxAllowed})
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('join');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95"
              >
                <KeyRound size={14} className="text-cyan-400" /> Entrar com Código
              </button>
            </div>
          </div>
        )}

        {/* 2. CREATE VIEW */}
        {view === 'create' && (
          <form onSubmit={handleCreate} className="mt-3 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Campeonato:
              </label>
              <input
                type="text"
                required
                maxLength={25}
                placeholder="ex: Liga da Família, Malta do Trabalho..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código de Convite (ex: FAMILIA, TRABALHO):
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="ex: FAMILIA24"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono uppercase tracking-wider"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Este código será usado para a família entrar neste campeonato.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setView('list')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-orbitron uppercase disabled:opacity-50"
              >
                {loading ? 'A criar...' : 'Criar Liga'}
              </button>
            </div>
          </form>
        )}

        {/* 3. JOIN VIEW */}
        {view === 'join' && (
          <form onSubmit={handleJoin} className="mt-3 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Inserir Código de Convite:
              </label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="ex: FAMILIA"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono uppercase tracking-widest text-center"
              />
              <span className="text-[10px] text-slate-400 mt-1 block text-center">
                Pede o código ao criador do campeonato para te juntares.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setView('list')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold font-orbitron uppercase disabled:opacity-50"
              >
                {loading ? 'A entrar...' : 'Entrar na Liga'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
