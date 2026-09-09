import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateUserClub, fetchUsers } from '../services/api';

const ThemeContext = createContext();

export const CLUB_THEMES = {
  SCP: {
    name: 'Sporting CP',
    short: 'SCP',
    primary: '#00D166',
    border: 'border-emerald-500',
    bgLight: 'bg-emerald-500/10',
    glow: 'rgba(0, 209, 102, 0.5)',
    textColor: 'text-emerald-400',
    badge: '🦁'
  },
  SLB: {
    name: 'SL Benfica',
    short: 'SLB',
    primary: '#FF2E4D',
    border: 'border-rose-500',
    bgLight: 'bg-rose-500/10',
    glow: 'rgba(255, 46, 77, 0.5)',
    textColor: 'text-rose-400',
    badge: '🦅'
  },
  FCP: {
    name: 'FC Porto',
    short: 'FCP',
    primary: '#007AFF',
    border: 'border-blue-500',
    bgLight: 'bg-blue-500/10',
    glow: 'rgba(0, 122, 255, 0.5)',
    textColor: 'text-blue-400',
    badge: '🐉'
  },
  GOLD: {
    name: 'Striker Gold',
    short: 'GOLD',
    primary: '#FFD700',
    border: 'border-amber-400',
    bgLight: 'bg-amber-400/10',
    glow: 'rgba(255, 215, 0, 0.5)',
    textColor: 'text-amber-400',
    badge: '⚡'
  }
};

export function ThemeProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('striker_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem('striker_user');
    const guestClub = localStorage.getItem('striker_guest_club');
    const club = saved ? JSON.parse(saved).favorite_club : (guestClub || 'SCP');
    return CLUB_THEMES[club] || CLUB_THEMES.SCP;
  });

  const applyTheme = (clubId) => {
    const theme = CLUB_THEMES[clubId] || CLUB_THEMES.SCP;
    setActiveTheme(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--club-primary', theme.primary);
      document.documentElement.style.setProperty('--club-glow', theme.glow);
      document.documentElement.setAttribute('data-theme', clubId.toLowerCase());
    }
  };

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem('striker_user', JSON.stringify(user));
    applyTheme(user.favorite_club);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('striker_user');
    const guestClub = localStorage.getItem('striker_guest_club') || 'SCP';
    applyTheme(guestClub);
  };

  const changeFavoriteClub = async (clubId) => {
    applyTheme(clubId);
    localStorage.setItem('striker_guest_club', clubId);
    
    if (currentUser) {
      try {
        const updated = await updateUserClub(currentUser.id, clubId);
        setCurrentUser(updated);
        localStorage.setItem('striker_user', JSON.stringify(updated));
      } catch (err) {
        console.error('Error changing club on server:', err);
      }
    }
  };

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    try {
      const users = await fetchUsers();
      const me = users.find(u => u.id === currentUser.id);
      if (me) {
        setCurrentUser(me);
        localStorage.setItem('striker_user', JSON.stringify(me));
        applyTheme(me.favorite_club);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  useEffect(() => {
    const club = currentUser?.favorite_club || localStorage.getItem('striker_guest_club') || 'SCP';
    applyTheme(club);
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentUser,
      activeTheme,
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
  return useContext(ThemeContext);
}
