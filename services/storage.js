// Работа с хранилищем данных. Сейчас — localStorage.
// Когда появится сервер друга: меняется ТОЛЬКО этот файл (localStorage.* на fetch(...)),
// весь остальной код приложения обращается сюда, а не к localStorage напрямую.

import { CUR_KEY, HIST_KEY } from "../constants";

export function loadCurrentMatch() {
  try {
    const raw = localStorage.getItem(CUR_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadCurrentMatch failed", e);
    return null;
  }
}

export function saveCurrentMatch(match, geimState, throws, gameScores) {
  try {
    localStorage.setItem(CUR_KEY, JSON.stringify({ match, geimState, throws, gameScores }));
    return true;
  } catch (e) {
    console.error("saveCurrentMatch failed", e);
    return false;
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadHistory failed", e);
    return [];
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error("saveHistory failed", e);
    return false;
  }
}
