// Чистая математика подсчёта статистики. Ничего не знает о React и об интерфейсе —
// принимает массив бросков, отдаёт проценты. Этот файл можно будет скопировать
// на сайт/сервер друга без переписывания.

import { DIST_ZONES } from "../constants";

export function pct(n, d) {
  if (!d) return "—";
  return Math.round((n / d) * 100) + "%";
}

export function calcPlayerStats(throws, playerName) {
  const rows = throws.filter((t) => t.player === playerName);
  const tirs = rows.filter((t) => t.type === "tir");
  const points = rows.filter((t) => t.type === "point");
  const tirSuccess = tirs.filter((t) => t.result === "hit" || t.result === "carreau").length;
  const carreau = tirs.filter((t) => t.result === "carreau").length;
  const pointSuccess = points.filter((t) => t.result === "success").length;
  const firstPoints = rows.filter((t) => t.firstPoint);
  const firstPointSuccess = firstPoints.filter((t) => t.result === "success").length;
  const tirsAuBut = tirs.filter((t) => t.tirAuBut);
  const tirAuButSuccess = tirsAuBut.filter((t) => t.result === "hit").length;
  return {
    tirTotal: tirs.length,
    tirSuccess,
    carreau,
    pointTotal: points.length,
    pointSuccess,
    firstPointTotal: firstPoints.length,
    firstPointSuccess,
    tirAuButTotal: tirsAuBut.length,
    tirAuButSuccess,
  };
}

export function sumStats(list) {
  return list.reduce(
    (acc, s) => ({
      tirTotal: acc.tirTotal + s.tirTotal,
      tirSuccess: acc.tirSuccess + s.tirSuccess,
      carreau: acc.carreau + s.carreau,
      pointTotal: acc.pointTotal + s.pointTotal,
      pointSuccess: acc.pointSuccess + s.pointSuccess,
      firstPointTotal: acc.firstPointTotal + s.firstPointTotal,
      firstPointSuccess: acc.firstPointSuccess + s.firstPointSuccess,
      tirAuButTotal: acc.tirAuButTotal + (s.tirAuButTotal || 0),
      tirAuButSuccess: acc.tirAuButSuccess + (s.tirAuButSuccess || 0),
    }),
    {
      tirTotal: 0,
      tirSuccess: 0,
      carreau: 0,
      pointTotal: 0,
      pointSuccess: 0,
      firstPointTotal: 0,
      firstPointSuccess: 0,
      tirAuButTotal: 0,
      tirAuButSuccess: 0,
    }
  );
}

export function zoneFor(dist) {
  const d = parseFloat(String(dist).replace(",", "."));
  if (isNaN(d)) return null;
  return DIST_ZONES.find((z) => z.test(d)) || null;
}

export function calcDistanceZones(throws, teamTag) {
  const out = { point: {}, tir: {} };
  DIST_ZONES.forEach((z) => {
    out.point[z.key] = { total: 0, success: 0 };
    out.tir[z.key] = { total: 0, success: 0 };
  });
  throws
    .filter((t) => t.team === teamTag)
    .forEach((t) => {
      const z = zoneFor(t.distance);
      if (!z || (t.type !== "point" && t.type !== "tir")) return;
      const bucket = out[t.type][z.key];
      bucket.total++;
      const ok = t.type === "point" ? t.result === "success" : t.result === "hit" || t.result === "carreau";
      if (ok) bucket.success++;
    });
  return out;
}

// Счёт на начало гейма g, по истории gameScores (счёт фиксируется ПОСЛЕ каждого гейма)
export function startScoreFor(g, gameScores) {
  if (g <= 1) return { team1: 0, team2: 0 };
  const prev = (gameScores || []).find((s) => s.geim === g - 1);
  return prev ? { team1: prev.team1Score, team2: prev.team2Score } : { team1: 0, team2: 0 };
}
