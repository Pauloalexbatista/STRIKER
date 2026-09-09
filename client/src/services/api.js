const BASE_URL = '/api';

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

export async function fetchGames(round = 25, userId = 'u1') {
  const res = await fetch(`${BASE_URL}/games?round=${round}&userId=${userId}`);
  return res.json();
}

export async function submitPrediction(userId, gameId, choice) {
  const res = await fetch(`${BASE_URL}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, gameId, choice })
  });
  return res.json();
}

export async function fetchGameReport(gameId) {
  const res = await fetch(`${BASE_URL}/games/${gameId}/report`);
  return res.json();
}

export async function fetchRoundLeaderboard(round = 25) {
  const res = await fetch(`${BASE_URL}/leaderboard/round/${round}`);
  return res.json();
}

export async function fetchGeneralLeaderboard() {
  const res = await fetch(`${BASE_URL}/leaderboard/general`);
  return res.json();
}

export async function simLockGame(gameId) {
  const res = await fetch(`${BASE_URL}/admin/games/${gameId}/lock`, { method: 'POST' });
  return res.json();
}

export async function simSettleGame(gameId, homeScore, awayScore) {
  const res = await fetch(`${BASE_URL}/admin/games/${gameId}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ homeScore, awayScore })
  });
  return res.json();
}

export async function simResetGame(gameId) {
  const res = await fetch(`${BASE_URL}/admin/games/${gameId}/reset`, { method: 'POST' });
  return res.json();
}
