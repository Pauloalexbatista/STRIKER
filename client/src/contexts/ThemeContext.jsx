import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateUserClub, fetchUsers } from '../services/api';

const ThemeContext = createContext();

export const CLUB_THEMES = {
  SCP: {
    name: 'Sporting CP',
    short: 'SCP',
    primary: '#00D166',
    border: 'border-emerald-500',
    bgLight: 'rgba(0, 209, 102, 0.15)',
    glow: 'rgba(0, 209, 102, 0.5)',
    textColor: 'text-emerald-400',
    badge: '🦁'
  },
  SLB: {
    name: 'SL Benfica',
    short: 'SLB',
    primary: '#FF2E4D',
    border: 'border-rose-500',
    bgLight: 'rgba(255, 46, 77, 0.15)',
    glow: 'rgba(255, 46, 77, 0.5)',
    textColor: 'text-rose-400',
    badge: '🦅'
  },
  FCP: {
    name: 'FC Porto',
    short: 'FCP',
    primary: '#007AFF',
    border: 'border-blue-500',
    bgLight: 'rgba(0, 122, 255, 0.15)',
    glow: 'rgba(0, 122, 255, 0.5)',
    textColor: 'text-blue-400',
    badge: '🐉'
  },
  GOLD: {
    name: 'Striker Gold',
    short: 'GOLD',
    primary: '#FFD700',
    border: 'border-amber-400',
    bgLight: 'rgba(255, 215, 0, 0.15)',
    glow: 'rgba(255, 215, 0, 0.5)',
    textColor: 'text-amber-400',
    badge: '⚡'
  }
};

export function hexToRgba(hex, alpha = 0.2) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(255, 215, 0, ${alpha})`;
  }
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ThemeProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('striker_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('striker_user');
      const user = saved ? JSON.parse(saved) : null;
      const guestClub = localStorage.getItem('striker_guest_club');
      const club = user?.favorite_club || guestClub || 'SCP';
      return CLUB_THEMES[club] || CLUB_THEMES.SCP;
    } catch {
      return CLUB_THEMES.SCP;
    }
  });

  const applyTheme = (clubId) => {
    const theme = CLUB_THEMES[clubId] || CLUB_THEMES.SCP;
    setActiveTheme(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--club-primary', theme.primary);
      document.documentElement.style.setProperty('--club-glow', theme.glow);
      document.documentElement.setAttribute('data-theme', (clubId || 'scp').toLowerCase());
    }
  };

  const login = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('striker_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    applyTheme(user?.favorite_club || 'SCP');
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('striker_user');
    } catch (e) {
      console.error(e);
    }
    const guestClub = localStorage.getItem('striker_guest_club') || 'SCP';
    applyTheme(guestClub);
  };

  const changeFavoriteClub = async (clubId) => {
    applyTheme(clubId);
    try {
      localStorage.setItem('striker_guest_club', clubId);
    } catch (e) {
      console.error(e);
    }
    
    if (currentUser) {
      try {
        const updated = await updateUserClub(currentUser.id, clubId);
        if (updated && updated.id) {
          setCurrentUser(updated);
          localStorage.setItem('striker_user', JSON.stringify(updated));
        }
      } catch (err) {
        console.error('Error changing club on server:', err);
      }
    }
  };

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    try {
      const users = await fetchUsers();
      if (Array.isArray(users)) {
        const me = users.find(u => u.id === currentUser.id);
        if (me) {
          setCurrentUser(me);
          localStorage.setItem('striker_user', JSON.stringify(me));
          applyTheme(me.favorite_club);
        }
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  useEffect(() => {
    try {
      const club = currentUser?.favorite_club || localStorage.getItem('striker_guest_club') || 'SCP';
      applyTheme(club);
    } catch {
      applyTheme('SCP');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentUser,
      activeTheme: activeTheme || CLUB_THEMES.SCP,
      login,
      logout,
      changeFavoriteClub,
      refreshCurrentUser
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      currentUser: null,
      activeTheme: CLUB_THEMES.SCP,
      login: () => {},
      logout: () => {},
      changeFavoriteClub: () => {},
      refreshCurrentUser: () => {}
    };
  }
  return ctx;
}
