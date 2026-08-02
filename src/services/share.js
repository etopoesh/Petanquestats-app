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
    return `  ${p} — ${t("tir")}: ${pct(s.tirSuccess, s.tirTotal)} (${s.tirSuccess}/${s.tirTotal}, ${t("carreau")} ${pct(s.carreau, s.tirTotal)}) · ${t("point")}: ${pct(
      s.pointSuccess,
      s.pointTotal
    )} (${s.pointSuccess}/${s.pointTotal})`;
  };

  const t1Total = sumStats(t1Players.map((p) => calcPlayerStats(throwsList, p)));
  const t2Total = sumStats(t2Players.map((p) => calcPlayerStats(throwsList, p)));

  const t1AllThrows = t1Total.tirTotal + t1Total.pointTotal;
  const t2AllThrows = t2Total.tirTotal + t2Total.pointTotal;

  const formatLabel = record.format && FORMATS[record.format] ? t(FORMATS[record.format].labelKey) : "";

  let text = `${record.event || t("share_default_match")} · ${formatLabel}\n`;
  text += `${t1Name} ${record.finalTeam1Score ?? 0} : ${record.finalTeam2Score ?? 0} ${t2Name}\n\n`;
  text += `«${t1Name}» — ${t("share_total_throws")}: ${t1AllThrows} · ${t("tir")}: ${pct(t1Total.tirSuccess, t1Total.tirTotal)} (${t("carreau")} ${pct(
    t1Total.carreau,
    t1Total.tirTotal
  )}), ${t("point")}: ${pct(t1Total.pointSuccess, t1Total.pointTotal)}\n`;
  t1Players.forEach((p) => (text += line(p) + "\n"));
  text += `\n«${t2Name}» — ${t("share_total_throws")}: ${t2AllThrows} · ${t("tir")}: ${pct(t2Total.tirSuccess, t2Total.tirTotal)} (${t("carreau")} ${pct(
    t2Total.carreau,
    t2Total.tirTotal
  )}), ${t("point")}: ${pct(t2Total.pointSuccess, t2Total.pointTotal)}\n`;
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
