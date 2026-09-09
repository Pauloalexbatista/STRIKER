import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchUsers, updateUserClub } from '../services/api';

const ThemeContext = createContext();

export const CLUB_THEMES = {
  SCP: {
    name: 'Sporting CP',
    short: 'SCP',
    primary: '#00D166',
    border: 'border-emerald-500',
    bgLight: 'bg-emerald-500/10',
    glow: 'rgba(0, 209, 102, 0.45)',
    textColor: 'text-emerald-400',
    badge: '🦁'
  },
  SLB: {
    name: 'SL Benfica',
    short: 'SLB',
    primary: '#FF2E4D',
    border: 'border-rose-500',
    bgLight: 'bg-rose-500/10',
    glow: 'rgba(255, 46, 77, 0.45)',
    textColor: 'text-rose-400',
    badge: '🦅'
  },
  FCP: {
    name: 'FC Porto',
    short: 'FCP',
    primary: '#007AFF',
    border: 'border-blue-500',
    bgLight: 'bg-blue-500/10',
    glow: 'rgba(0, 122, 255, 0.45)',
    textColor: 'text-blue-400',
    badge: '🐉'
  },
  GOLD: {
    name: 'Striker Gold',
    short: 'GOLD',
    primary: '#FFD700',
    border: 'border-amber-400',
    bgLight: 'bg-amber-400/10',
    glow: 'rgba(255, 215, 0, 0.45)',
    textColor: 'text-amber-400',
    badge: '⚡'
  }
};

export function ThemeProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTheme, setActiveTheme] = useState(CLUB_THEMES.SCP);

  const refreshUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
      if (!currentUser && data.length > 0) {
        // Default to Paulo (u1)
        const defaultUser = data.find(u => u.id === 'u1') || data[0];
        setCurrentUser(defaultUser);
        applyTheme(defaultUser.favorite_club);
      } else if (currentUser) {
        const updated = data.find(u => u.id === currentUser.id);
        if (updated) {
          setCurrentUser(updated);
          applyTheme(updated.favorite_club);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const applyTheme = (clubId) => {
    const theme = CLUB_THEMES[clubId] || CLUB_THEMES.SCP;
    setActiveTheme(theme);
    document.documentElement.style.setProperty('--club-primary', theme.primary);
    document.documentElement.style.setProperty('--club-glow', theme.glow);
  };

  const switchUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      applyTheme(user.favorite_club);
    }
  };

  const changeFavoriteClub = async (clubId) => {
    if (!currentUser) return;
    try {
      const updated = await updateUserClub(currentUser.id, clubId);
      setCurrentUser(updated);
      applyTheme(clubId);
      refreshUsers();
    } catch (err) {
      console.error('Error changing club:', err);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <ThemeContext.Provider value={{
      users,
      currentUser,
      activeTheme,
      switchUser,
      changeFavoriteClub,
      refreshUsers
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
