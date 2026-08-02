// Цвета, форматы игры, ключи хранилища, зоны дистанции.
// Меняется редко — но на это ссылается почти весь остальной код.
// Названия форматов/зон переведены через словарь (см. i18n/dictionary.js),
// здесь остаётся только структурная информация.

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
// labelKey — ключ перевода названия формата (t(labelKey))
export const FORMATS = {
  triplet: { labelKey: "format_triplet", team1: 3, team2: 3, balls: 2 },
  doublet: { labelKey: "format_doublet", team1: 2, team2: 2, balls: 3 },
  tete: { labelKey: "format_tete", team1: 1, team2: 1, balls: 3 },
};

export const CUR_KEY = "petanque_current_v2";
export const HIST_KEY = "petanque_history_v2";

// Дистанция — три именованные зоны. labelKey/hintKey переводятся через t().
export const DIST_ZONES = [
  { key: "near", labelKey: "zone_near_label", hintKey: "zone_near_hint", test: (d) => d <= 7 },
  { key: "mid", labelKey: "zone_mid_label", hintKey: "zone_mid_hint", test: (d) => d > 7 && d <= 8.5 },
  { key: "far", labelKey: "zone_far_label", hintKey: "zone_far_hint", test: (d) => d > 8.5 },
];
