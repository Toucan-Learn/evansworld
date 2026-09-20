export const LADDERS = { 3: 22, 8: 30, 20: 41, 36: 57, 50: 69, 71: 92 };
export const SNAKES = { 27: 10, 47: 25, 65: 44, 86: 63, 97: 78 };
export function newGame(players = 1) {
  return { players: players === 2 ? 2 : 1, positions: [0, 0], turn: 0, dice: null, winner: null, moves: 0 };
}
export function roll(state, random = Math.random) {
  if (state.dice || state.winner !== null) return state;
  return { ...state, dice: [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)] };
}
export function answer(state, value) {
  if (!state.dice || state.winner !== null) return { state, correct: false };
  const [a, b] = state.dice;
  if (!/^\d+$/.test(String(value).trim()) || Number(value) !== a * b) return { state, correct: false };
  const landing = Math.min(100, state.positions[state.turn] + a * b);
  const destination = LADDERS[landing] || SNAKES[landing] || landing;
  const positions = [...state.positions]; positions[state.turn] = destination;
  const winner = destination === 100 ? state.turn : null;
  return { correct: true, landing, destination, player: state.turn, state: { ...state, positions, winner, dice: null, moves: state.moves + 1, turn: winner === null ? (state.turn + 1) % state.players : state.turn } };
}
export function squarePoint(n) {
  const row = Math.floor((Math.max(1, n) - 1) / 10), column = (Math.max(1, n) - 1) % 10;
  return { x: (row % 2 ? 9 - column : column) * 10 + 5, y: (9 - row) * 10 + 5 };
}
