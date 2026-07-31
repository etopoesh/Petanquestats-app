// Цвета, форматы игры, ключи хранилища, зоны дистанции.
// Меняется редко — но на это ссылается почти весь остальной код.

export const INK = "#262421";
export const PAPER = "#E9E4D8";
export const PINE = "#2F5233";
export const PINE_DARK = "#1F3A24";
export const BRONZE = "#B07A3E";
export const GOOD = "#3C7A4B";
export const BAD = "#A23B32";
export const YELLOW = "#C8860D";
export const CARD = "#F1EEE5";
export const BORDER = "#c9c2b0";

// balls = сколько шаров бросает КАЖДЫЙ игрок за гейм (не команда)
export const FORMATS = {
  triplet: { label: "Триплет", team1: 3, team2: 3, balls: 2 },
  doublet: { label: "Дуплет", team1: 2, team2: 2, balls: 3 },
  tete: { label: "Тет-а-тет", team1: 1, team2: 1, balls: 3 },
};

export const CUR_KEY = "petanque_current_v2";
export const HIST_KEY = "petanque_history_v2";

// Дистанция — три именованные зоны вместо числовых меток
export const DIST_ZONES = [
  { key: "near", label: "Ближняя", hint: "≤ 7 м", test: (d) => d <= 7 },
  { key: "mid", label: "Средняя", hint: "7.1 – 8.5 м", test: (d) => d > 7 && d <= 8.5 },
  { key: "far", label: "Дальняя", hint: "≥ 8.51 м", test: (d) => d > 8.5 },
];
