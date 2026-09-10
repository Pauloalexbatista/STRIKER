const BASE_URL = '/api';

export async function loginUser(name, pin, favoriteClub) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, pin, favoriteClub })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao entrar');
  }
  return res.json();
}

export async function createLeague(userId, name, code) {
  const res = await fetch(`${BASE_URL}/leagues/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, code })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao criar campeonato');
  }
  return res.json();
}

export async function joinLeague(userId, code) {
  const res = await fetch(`${BASE_URL}/leagues/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao entrar no campeonato');
  }
  return res.json();
}

export async function fetchMyLeagues(userId) {
  const res = await fetch(`${BASE_URL}/leagues/my?userId=${userId}`);
  return res.json();
}

export async function fetchClubs() {
  const res = await fetch(`${BASE_URL}/clubs`);
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${BASE_URL}/users`);
  return res.json();
}

export async function updateUserClub(userId, clubId) {
  const res = await fetch(`${BASE_URL}/users/update-club`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, clubId })
  });
  return res.json();
}

export async function fetchGames(round = 6, userId = '', leagueId = '') {
  const res = await fetch(`${BASE_URL}/games?round=${round}&userId=${userId}&leagueId=${leagueId}`);
  return res.json();
}

export async function submitPrediction(userId, gameId, choice, leagueId) {
  const res = await fetch(`${BASE_URL}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, gameId, choice, leagueId })
  });
  return res.json();
}

export async function fetchGameReport(gameId, leagueId = '') {
  const res = await fetch(`${BASE_URL}/games/${gameId}/report?leagueId=${leagueId}`);
  return res.json();
}

export async function fetchRoundLeaderboard(round = 6, leagueId = '') {
  const res = await fetch(`${BASE_URL}/leaderboard/round/${round}?leagueId=${leagueId}`);
  return res.json();
}

export async function fetchGeneralLeaderboard(leagueId = '') {
  const res = await fetch(`${BASE_URL}/leaderboard/general?leagueId=${leagueId}`);
  return res.json();
}
