import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle, FileUp } from "lucide-react";
import { PINE, BORDER, BAD, CARD } from "../constants";
import { useLang } from "../i18n/LangContext";
import { exportBackup, readBackupFile, applyBackup, readMatchFile } from "../services/backup";

// Полная резервная копия (заменяет всё) + импорт отдельной партии (только добавляет).
export default function BackupControls({ onImportMatch }) {
  const { t } = useLang();
  const fullFileRef = useRef(null);
  const matchFileRef = useRef(null);

  const [status, setStatus] = useState(null); // { type: 'ok'|'error', text }
  const [pendingFull, setPendingFull] = useState(null);
  const [pendingMatch, setPendingMatch] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleExportFull = async () => {
    setBusy(true);
    setStatus(null);
    const res = await exportBackup();
    setBusy(false);
    if (res.ok) {
      if (res.method === "filesystem+share") setStatus({ type: "ok", text: t("export_ok_share") });
      else if (res.method === "filesystem-only") setStatus({ type: "ok", text: t("export_ok_path", { path: res.path }) });
      else setStatus({ type: "ok", text: t("export_ok_download") });
    } else {
      setStatus({ type: "error", text: t("export_error") });
    }
  };

  const handleFullFilePicked = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setStatus(null);
    const res = await readBackupFile(file);
    setBusy(false);
    if (!res.ok) {
      setStatus({ type: "error", text: t(res.errorCode) });
      return;
    }
    setPendingFull(res.data);
  };

  const confirmFullImport = () => {
    const res = applyBackup(pendingFull);
    setPendingFull(null);
    if (res.ok) window.location.reload();
    else setStatus({ type: "error", text: t("export_error") });
  };

  const handleMatchFilePicked = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setStatus(null);
    const res = await readMatchFile(file);
    setBusy(false);
    if (!res.ok) {
      setStatus({ type: "error", text: t(res.errorCode) });
      return;
    }
    setPendingMatch(res.record);
  };

  const confirmMatchImport = () => {
    onImportMatch(pendingMatch);
    setPendingMatch(null);
    setStatus({ type: "ok", text: t("match_added") });
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="rounded-lg border-2 p-3" style={{ borderColor: BORDER, backgroundColor: CARD }}>
        <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-70">{t("backup_title")}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportFull}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-white text-xs"
            style={{ backgroundColor: PINE, opacity: busy ? 0.6 : 1 }}
          >
            <Download size={13} /> {t("export_btn")}
          </button>
          <button
            onClick={() => fullFileRef.current && fullFileRef.current.click()}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-xs border-2"
            style={{ borderColor: PINE, color: PINE, opacity: busy ? 0.6 : 1 }}
          >
            <Upload size={13} /> {t("import_btn")}
          </button>
          <input ref={fullFileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFullFilePicked} />
        </div>

        {pendingFull && (
          <div className="mt-3 p-2.5 rounded-md border-2 text-xs" style={{ borderColor: BAD, backgroundColor: "#fbe9e7" }}>
            <div className="flex items-start gap-1.5 font-semibold mb-2" style={{ color: BAD }}>
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                {t("import_confirm_full", {
                  n: pendingFull.history?.length ?? 0,
                  current: pendingFull.current?.match ? t("import_confirm_full_current") : "",
                })}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={confirmFullImport} className="px-3 py-1.5 rounded text-white font-bold" style={{ backgroundColor: BAD }}>
                {t("replace_btn")}
              </button>
              <button onClick={() => setPendingFull(null)} className="px-3 py-1.5 rounded font-bold border-2" style={{ borderColor: BORDER }}>
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border-2 p-3" style={{ borderColor: BORDER, backgroundColor: CARD }}>
        <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-70">{t("import_match_title")}</div>
        <button
          onClick={() => matchFileRef.current && matchFileRef.current.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md font-bold text-xs border-2"
          style={{ borderColor: PINE, color: PINE, opacity: busy ? 0.6 : 1 }}
        >
          <FileUp size={13} /> {t("import_match_btn")}
        </button>
        <input ref={matchFileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleMatchFilePicked} />

        {pendingMatch && (
          <div className="mt-3 p-2.5 rounded-md border-2 text-xs" style={{ borderColor: PINE, backgroundColor: "#dfe6df" }}>
            <div className="font-semibold mb-2">
              {t("import_confirm_match", {
                t1: pendingMatch.team1Name || t("default_team1"),
                t2: pendingMatch.team2Name || t("default_team2"),
                score: `${pendingMatch.finalTeam1Score ?? 0}:${pendingMatch.finalTeam2Score ?? 0}`,
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={confirmMatchImport} className="px-3 py-1.5 rounded text-white font-bold" style={{ backgroundColor: PINE }}>
                {t("add_btn")}
              </button>
              <button onClick={() => setPendingMatch(null)} className="px-3 py-1.5 rounded font-bold border-2" style={{ borderColor: BORDER }}>
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </div>

      {status && (
        <div className="text-xs font-semibold" style={{ color: status.type === "error" ? BAD : PINE }}>
          {status.text}
        </div>
      )}
    </div>
  );
}
