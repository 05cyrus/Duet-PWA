/** Registry of all love games shown in the Games hub. */

export interface GameDef {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  players: "solo" | "pass-and-play" | "both";
  xp: number;
}

export const GAMES: GameDef[] = [
  { id: "love-quiz",      name: "Love Quiz",         emoji: "💘", tagline: "How well do you know love?",        players: "both",          xp: 20 },
  { id: "couple-trivia",  name: "Couple Trivia",     emoji: "🎯", tagline: "Guess each other's answers",        players: "pass-and-play", xp: 20 },
  { id: "this-or-that",   name: "This or That",      emoji: "⚖️", tagline: "Do your picks match?",              players: "pass-and-play", xp: 10 },
  { id: "truth-or-dare",  name: "Truth or Dare",     emoji: "🎲", tagline: "Spicy truths, sweet dares",         players: "pass-and-play", xp: 10 },
  { id: "never-have-i",   name: "Never Have I Ever", emoji: "🙈", tagline: "Confess with fingers up",           players: "pass-and-play", xp: 10 },
  { id: "spin-bottle",    name: "Spin the Bottle",   emoji: "🍾", tagline: "Let fate pick the prompt",          players: "pass-and-play", xp: 10 },
  { id: "guess-emoji",    name: "Guess the Emoji",   emoji: "🧩", tagline: "Decode the emoji riddle",           players: "both",          xp: 15 },
  { id: "memory-match",   name: "Memory Match",      emoji: "🃏", tagline: "Find the matching pairs",           players: "both",          xp: 15 },
  { id: "sliding-puzzle", name: "Puzzle Game",       emoji: "🧠", tagline: "Slide tiles into order",            players: "both",          xp: 15 },
  { id: "tic-tac-toe",    name: "Tic Tac Toe",       emoji: "⭕", tagline: "Hearts vs. kisses",                 players: "pass-and-play", xp: 10 },
  { id: "connect-four",   name: "Connect Four",      emoji: "🔴", tagline: "Four in a row wins",                players: "pass-and-play", xp: 15 },
  { id: "hangman",        name: "Hangman",           emoji: "🪢", tagline: "Guess the romantic word",           players: "both",          xp: 15 },
  { id: "word-search",    name: "Word Search",       emoji: "🔍", tagline: "Find the hidden love words",        players: "both",          xp: 15 },
  { id: "love-bingo",     name: "Love Bingo",        emoji: "🎱", tagline: "Complete sweet moments",            players: "both",          xp: 20 },
  { id: "daily-challenge",name: "Daily Challenge",   emoji: "🌟", tagline: "One sweet mission a day",           players: "both",          xp: 25 },
];

export const GEOMETRY_GAME: GameDef = {
  id: "geometry-track", name: "Geometry Track", emoji: "🚀",
  tagline: "Dash through the love track", players: "both", xp: 30,
};

export function gameById(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}
