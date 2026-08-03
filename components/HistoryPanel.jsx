import { useState } from "react";
import { Share2, FileDown, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { FORMATS, BORDER, BAD } from "../constants";
import { useLang } from "../i18n/LangContext";
import { exportMatchRecord } from "../services/backup";
import StatsPanel from "./StatsPanel";
import BackupControls from "./BackupControls";

export default function HistoryPanel({ history, onShare, onDelete, onImportMatch }) {
  const { t } = useLang();
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleExportFile = async (rec) => {
    setExportingId(rec.id);
    const res = await exportMatchRecord(rec);
    setExportingId(null);
    if (!res.ok) alert(t("export_error"));
  };

  return (
    <div>
      <h2 className="text-xl font-black mb-3">{t("history_title")}</h2>
      {!history || history.length === 0 ? (
        <div className="text-sm opacity-60 text-center py-8">{t("history_empty")}</div>
      ) : (
        <div className="space-y-3 mb-5">
          {history.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const isDeleting = deleteConfirmId === rec.id;
            const team1Name = rec.team1Name || t("default_team1");
            const team2Name = rec.team2Name || t("default_team2");
            const score1 = rec.finalTeam1Score ?? 0;
            const score2 = rec.finalTeam2Score ?? 0;

            return (
              <div key={rec.id} className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="cursor-pointer flex-1 mr-2" onClick={() => toggleExpand(rec.id)}>
                    <div className="text-[10px] uppercase opacity-60 flex items-center gap-1 flex-wrap">
                      <span>{rec.date}</span>
                      {rec.event && <span>· {rec.event}</span>}
                      {rec.format && FORMATS[rec.format] && <span>· {t(FORMATS[rec.format].labelKey)}</span>}
                    </div>
                    <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                      <span className="truncate">{team1Name}</span>
                      <span className="font-black shrink-0">
                        {score1} : {score2}
                      </span>
                      <span className="truncate">{team2Name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => onShare(rec)} className="p-1.5 rounded border opacity-70" style={{ borderColor: BORDER }} title={t("share_tip")}>
                      <Share2 size={14} />
                    </button>
                    <button
                      onClick={() => handleExportFile(rec)}
                      disabled={exportingId === rec.id}
                      className="p-1.5 rounded border opacity-70"
                      style={{ borderColor: BORDER, opacity: exportingId === rec.id ? 0.4 : 0.7 }}
                      title={t("export_file_tip")}
                    >
                      <FileDown size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(isDeleting ? null : rec.id)}
                      className="p-1.5 rounded border opacity-70"
                      style={{ borderColor: BORDER, color: BAD }}
                      title={t("delete_tip")}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => toggleExpand(rec.id)} className="p-1.5 rounded border opacity-70" style={{ borderColor: BORDER }} title={t("details_tip")}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {isDeleting && (
                  <div className="mt-2 p-2 rounded border text-xs" style={{ borderColor: BAD, backgroundColor: "#fbe9e7" }}>
                    <div className="font-semibold mb-1.5" style={{ color: BAD }}>
                      {t("confirm_delete_record")}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onDelete(rec.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-1 rounded text-white font-bold"
                        style={{ backgroundColor: BAD }}
                      >
                        {t("delete_btn")}
                      </button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 rounded font-bold border" style={{ borderColor: BORDER }}>
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: BORDER }}>
                    <StatsPanel match={rec} throws={rec.throws || []} gameScores={rec.gameScores || []} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <BackupControls onImportMatch={onImportMatch} />
    </div>
  );
}
