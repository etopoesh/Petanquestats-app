import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { PINE, BORDER, BAD, CARD } from "../constants";
import { exportBackup, readBackupFile, applyBackup } from "../services/backup";

export default function BackupControls() {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'ok'|'error', text }
  const [pending, setPending] = useState(null); // распарсенный файл, ждёт подтверждения
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);
    const res = await exportBackup();
    setBusy(false);
    if (res.ok) {
      setStatus({ type: "ok", text: res.method === "share" ? "Готово — выберите, куда сохранить файл" : "Файл скачан" });
    } else {
      setStatus({ type: "error", text: "Не получилось создать копию" });
    }
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // чтобы можно было выбрать тот же файл повторно
    if (!file) return;
    setBusy(true);
    setStatus(null);
    const res = await readBackupFile(file);
    setBusy(false);
    if (!res.ok) {
      setStatus({ type: "error", text: res.error });
      return;
    }
    setPending(res.data);
  };

  const confirmImport = () => {
    const res = applyBackup(pending);
    setPending(null);
    if (res.ok) {
      window.location.reload();
    } else {
      setStatus({ type: "error", text: "Не получилось восстановить данные" });
    }
  };

  return (
    <div className="mb-4 rounded-lg border-2 p-3" style={{ borderColor: BORDER, backgroundColor: CARD }}>
      <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-70">Резервная копия</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExport}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-white text-xs"
          style={{ backgroundColor: PINE, opacity: busy ? 0.6 : 1 }}
        >
          <Download size={13} /> Скачать копию
        </button>
        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-xs border-2"
          style={{ borderColor: PINE, color: PINE, opacity: busy ? 0.6 : 1 }}
        >
          <Upload size={13} /> Загрузить копию
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFilePicked} />
      </div>

      {status && (
        <div className="text-xs mt-2 font-semibold" style={{ color: status.type === "error" ? BAD : PINE }}>
          {status.text}
        </div>
      )}

      {pending && (
        <div className="mt-3 p-2.5 rounded-md border-2 text-xs" style={{ borderColor: BAD, backgroundColor: "#fbe9e7" }}>
          <div className="flex items-start gap-1.5 font-semibold mb-2" style={{ color: BAD }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              В файле {pending.history?.length ?? 0} партий в истории{pending.current?.match ? " + текущая незавершённая партия" : ""}.
              Загрузка заменит все данные, которые сейчас есть в приложении. Продолжить?
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={confirmImport} className="px-3 py-1.5 rounded text-white font-bold" style={{ backgroundColor: BAD }}>
              Да, заменить
            </button>
            <button onClick={() => setPending(null)} className="px-3 py-1.5 rounded font-bold border-2" style={{ borderColor: BORDER }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
