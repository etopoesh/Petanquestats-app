// Помощники для настройки партии. Чистые функции, без React и без хранилища —
// поэтому их тоже можно будет забрать на сайт/сервер без переписывания.

import { FORMATS } from "../constants";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyDraft() {
  return {
    format: "triplet",
    date: todayISO(),
    event: "",
    team1Name: "",
    team2Name: "",
    team1Players: Array(3).fill(""),
    team2Players: Array(3).fill(""),
  };
}

// Меняет формат партии, сохраняя уже введённые имена там, где они ещё applicable
export function withFormat(draft, newFormat) {
  const cfg = FORMATS[newFormat];
  const resize = (arr, n) => {
    const next = (arr || []).slice(0, n);
    while (next.length < n) next.push("");
    return next;
  };
  return {
    ...draft,
    format: newFormat,
    team1Players: resize(draft.team1Players, cfg.team1),
    team2Players: resize(draft.team2Players, cfg.team2),
  };
}
