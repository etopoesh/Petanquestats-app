// Резервное копирование. Два режима:
// 1) Полная копия — вся история + текущая партия в одном файле, импорт заменяет всё.
// 2) Файл одной партии — как демка в играх: можно переслать другу, импорт ДОБАВЛЯЕТ
//    партию в историю, ничего не стирая.
// Работает поверх storage.js — не трогает формат данных, просто упаковывает его.
// Сообщения об ошибках — кодами (errorCode), тексты берутся из словаря в UI-компонентах.

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { loadCurrentMatch, saveCurrentMatch, loadHistory, saveHistory } from "./storage";

const BACKUP_VERSION = 1;

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

// Общая логика записи файла: на телефоне — Filesystem + системное "поделиться",
// в обычном браузере — скачивание через blob-ссылку.
async function writeAndShare(name, json, shareTitle) {
  if (Capacitor.isNativePlatform()) {
    try {
      const written = await Filesystem.writeFile({
        path: name,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      try {
        await Share.share({ title: shareTitle, url: written.uri, dialogTitle: shareTitle });
        return { ok: true, method: "filesystem+share", path: "Documents/" + name };
      } catch (shareErr) {
        return { ok: true, method: "filesystem-only", path: "Documents/" + name };
      }
    } catch (e) {
      console.error("writeAndShare (native) failed", e);
      return { ok: false, error: e };
    }
  }

  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, method: "download" };
  } catch (e) {
    console.error("writeAndShare (web) failed", e);
    return { ok: false, error: e };
  }
}

function readJsonFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve({ ok: true, data: JSON.parse(reader.result) });
      } catch (e) {
        resolve({ ok: false, errorCode: "import_error_parse" });
      }
    };
    reader.onerror = () => resolve({ ok: false, errorCode: "import_error_read" });
    reader.readAsText(file);
  });
}

// ---------- Полная резервная копия ----------

export async function exportBackup() {
  const payload = {
    backupVersion: BACKUP_VERSION,
    kind: "full",
    exportedAt: new Date().toISOString(),
    current: loadCurrentMatch() || null,
    history: loadHistory() || [],
  };
  const name = `petanque-backup-${todayStamp()}.json`;
  return writeAndShare(name, JSON.stringify(payload, null, 2), "Petanque Stats — backup");
}

export async function readBackupFile(file) {
  const res = await readJsonFile(file);
  if (!res.ok) return res;
  if (!("history" in res.data)) return { ok: false, errorCode: "import_error_not_backup" };
  return { ok: true, data: res.data };
}

export function applyBackup(data) {
  try {
    if (data.current && data.current.match) {
      saveCurrentMatch(data.current.match, data.current.geimState, data.current.throws, data.current.gameScores);
    } else {
      saveCurrentMatch(null, { geim: 1, team1Score: 0, team2Score: 0, distance: "" }, [], []);
    }
    saveHistory(data.history || []);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

// ---------- Файл одной партии ----------

export async function exportMatchRecord(record) {
  const payload = {
    backupVersion: BACKUP_VERSION,
    kind: "match",
    exportedAt: new Date().toISOString(),
    match: record,
  };
  const safeDate = (record.date || todayStamp()).replace(/[^0-9-]/g, "");
  const name = `petanque-match-${safeDate}-${record.id}.json`;
  return writeAndShare(name, JSON.stringify(payload, null, 2), "Petanque Stats — match");
}

export async function readMatchFile(file) {
  const res = await readJsonFile(file);
  if (!res.ok) return res;
  const data = res.data;
  const record = data.kind === "match" && data.match ? data.match : data.throws && data.team1Players ? data : null;
  if (!record) return { ok: false, errorCode: "import_error_not_match" };
  return { ok: true, record };
}

// Добавляет партию в историю, не трогая остальные. Возвращает новый массив истории.
export function addMatchToHistory(record, currentHistory) {
  const withNewId = { ...record, id: Date.now() + Math.random() };
  return [withNewId, ...(currentHistory || [])];
}
