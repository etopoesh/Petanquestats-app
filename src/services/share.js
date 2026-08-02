// Формирование текста статистики для "поделиться" и сам вызов системного шеринга.
// Это не React-компонент, поэтому язык берём напрямую из localStorage (тот же
// ключ, что использует LangContext), а не через хук.

import { FORMATS } from "../constants";
import { pct, calcPlayerStats, sumStats } from "../utils/stats";
import { translate, LANG_KEY, DEFAULT_LANG } from "../i18n/dictionary";

function currentLang() {
  try {
    return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
  } catch (e) {
    return DEFAULT_LANG;
  }
}

// Полная статистика (без разбивки по дистанции), без подписи разработчика
export function buildShareText(record) {
  const lang = currentLang();
  const t = (key, vars) => translate(lang, key, vars);

  const t1Name = record.team1Name || t("default_team1");
  const t2Name = record.team2Name || t("default_team2");
  const t1Players = record.team1Players || [];
  const t2Players = record.team2Players || [];
  const throwsList = record.throws || [];

  const line = (p) => {
    const s = calcPlayerStats(throwsList, p);
    let str = `  ${p} — ${t("tir")}: ${pct(s.tirSuccess, s.tirTotal)} (${s.tirSuccess}/${s.tirTotal}, ${t("carreau")} ${pct(s.carreau, s.tirTotal)}) · ${t("point")}: ${pct(
      s.pointSuccess,
      s.pointTotal
    )} (${s.pointSuccess}/${s.pointTotal})`;
    if (s.tirAuButTotal > 0) {
      str += ` · ${t("stat_tir_au_but")}: ${pct(s.tirAuButSuccess, s.tirAuButTotal)} (${s.tirAuButSuccess}/${s.tirAuButTotal})`;
    }
    return str;
  };

  const t1Total = sumStats(t1Players.map((p) => calcPlayerStats(throwsList, p)));
  const t2Total = sumStats(t2Players.map((p) => calcPlayerStats(throwsList, p)));

  const formatLabel = record.format && FORMATS[record.format] ? t(FORMATS[record.format].labelKey) : "";

  // Показываем количество бросков КАЖДОГО типа отдельно — без этого проценты не на что опереться.
  const teamLine = (name, s) =>
    `«${name}» — ${t("tir")}: ${s.tirTotal} (${pct(s.tirSuccess, s.tirTotal)}, ${t("carreau")} ${pct(s.carreau, s.tirTotal)}) · ${t("point")}: ${s.pointTotal} (${pct(
      s.pointSuccess,
      s.pointTotal
    )})${s.tirAuButTotal > 0 ? ` · ${t("stat_tir_au_but")}: ${s.tirAuButTotal} (${pct(s.tirAuButSuccess, s.tirAuButTotal)})` : ""}`;

  let text = `${record.event || t("share_default_match")} · ${formatLabel}\n`;
  text += `${t1Name} ${record.finalTeam1Score ?? 0} : ${record.finalTeam2Score ?? 0} ${t2Name}\n\n`;
  text += teamLine(t1Name, t1Total) + "\n";
  t1Players.forEach((p) => (text += line(p) + "\n"));
  text += `\n` + teamLine(t2Name, t2Total) + "\n";
  t2Players.forEach((p) => (text += line(p) + "\n"));

  return text.trim();
}

export async function shareRecord(record) {
  const lang = currentLang();
  const t = (key) => translate(lang, key);
  const text = buildShareText(record);
  if (navigator.share) {
    try {
      await navigator.share({ title: t("share_title"), text });
    } catch (e) {
      // пользователь закрыл системное окно — это нормально, не ошибка
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      alert(t("share_copied"));
    } catch (e) {
      alert(text);
    }
  } else {
    alert(text);
  }
}
