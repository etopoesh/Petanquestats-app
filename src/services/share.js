// Формирование текста статистики для "поделиться" и сам вызов системного шеринга.

import { FORMATS } from "../constants";
import { pct, calcPlayerStats, sumStats } from "../utils/stats";

// Полная статистика (без разбивки по дистанции), без подписи разработчика
export function buildShareText(record) {
  const t1Name = record.team1Name || "Команда 1";
  const t2Name = record.team2Name || "Команда 2";
  const t1Players = record.team1Players || [];
  const t2Players = record.team2Players || [];
  const throwsList = record.throws || [];

  const line = (p) => {
    const s = calcPlayerStats(throwsList, p);
    return `  ${p} — тир: ${pct(s.tirSuccess, s.tirTotal)} (${s.tirSuccess}/${s.tirTotal}, каро ${pct(s.carreau, s.tirTotal)}) · пойнт: ${pct(s.pointSuccess, s.pointTotal)} (${s.pointSuccess}/${s.pointTotal})`;
  };

  const t1Total = sumStats(t1Players.map((p) => calcPlayerStats(throwsList, p)));
  const t2Total = sumStats(t2Players.map((p) => calcPlayerStats(throwsList, p)));

  const t1AllThrows = t1Total.tirTotal + t1Total.pointTotal;
  const t2AllThrows = t2Total.tirTotal + t2Total.pointTotal;

  let text = `${record.event || "Партия"} · ${FORMATS[record.format]?.label || ""}\n`;
  text += `${t1Name} ${record.finalTeam1Score ?? 0} : ${record.finalTeam2Score ?? 0} ${t2Name}\n\n`;
  text += `«${t1Name}» — всего бросков: ${t1AllThrows} · тир: ${pct(t1Total.tirSuccess, t1Total.tirTotal)} (каро ${pct(t1Total.carreau, t1Total.tirTotal)}), пойнт: ${pct(t1Total.pointSuccess, t1Total.pointTotal)}\n`;
  t1Players.forEach((p) => (text += line(p) + "\n"));
  text += `\n«${t2Name}» — всего бросков: ${t2AllThrows} · тир: ${pct(t2Total.tirSuccess, t2Total.tirTotal)} (каро ${pct(t2Total.carreau, t2Total.tirTotal)}), пойнт: ${pct(t2Total.pointSuccess, t2Total.pointTotal)}\n`;
  t2Players.forEach((p) => (text += line(p) + "\n"));

  return text.trim();
}

export async function shareRecord(record) {
  const text = buildShareText(record);
  if (navigator.share) {
    try {
      await navigator.share({ title: "Статистика партии — петанк", text });
    } catch (e) {
      // пользователь закрыл системное окно — это нормально, не ошибка
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Текст статистики скопирован — вставьте в соцсеть");
    } catch (e) {
      alert(text);
    }
  } else {
    alert(text);
  }
}
