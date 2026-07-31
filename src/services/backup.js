// Резервное копирование: выгрузка текущей партии + всей истории в один JSON-файл,
// и восстановление из такого файла. Работает поверх storage.js — не трогает
// формат данных, просто упаковывает то, что там уже лежит.

import { loadCurrentMatch, saveCurrentMatch, loadHistory, saveHistory } from "./storage";

const BACKUP_VERSION = 1;

function buildBackupPayload() {
  const current = loadCurrentMatch();
  const history = loadHistory();
  return {
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    current: current || null,
    history: history || [],
  };
}

function fileName() {
  const d = new Date().toISOString().slice(0, 10);
  return `petanque-backup-${d}.json`;
}

// Экспорт: пробуем системное "поделиться файлом" (сохранить в Файлы/Диск/переслать),
// если недоступно — обычная скачиваемая ссылка.
export async function exportBackup() {
  const payload = buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const name = fileName();

  if (navigator.canShare && navigator.share) {
    try {
      const file = new File([blob], name, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Резервная копия — петанк" });
        return { ok: true, method: "share" };
      }
    } catch (e) {
      // пользователь закрыл окно шеринга — не ошибка, просто не мешаем
    }
  }

  try {
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
    console.error("exportBackup failed", e);
    return { ok: false, error: e };
  }
}

// Импорт, шаг 1: читает и проверяет файл, ничего не пишет в хранилище.
export function readBackupFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!("history" in data)) {
          resolve({ ok: false, error: "Файл не похож на резервную копию" });
          return;
        }
        resolve({ ok: true, data });
      } catch (e) {
        resolve({ ok: false, error: "Не удалось прочитать файл — повреждён или не тот формат" });
      }
    };
    reader.onerror = () => resolve({ ok: false, error: "Ошибка чтения файла" });
    reader.readAsText(file);
  });
}

// Импорт, шаг 2: перезаписывает хранилище. Вызывать только после подтверждения пользователем.
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
