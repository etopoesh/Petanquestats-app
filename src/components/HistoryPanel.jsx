import { useState } from "react";
import { Share2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { FORMATS, BORDER, BAD } from "../constants";
import StatsPanel from "./StatsPanel";
import BackupControls from "./BackupControls";

export default function HistoryPanel({ history, onShare, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div>
      <h2 className="text-xl font-black mb-3">История партий</h2>
      <BackupControls />
      {!history || history.length === 0 ? (
        <div className="text-sm opacity-60 text-center py-8">История партий пуста</div>
      ) : (
        <div className="space-y-3">
        {history.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const isDeleting = deleteConfirmId === rec.id;
          const team1Name = rec.team1Name || "Команда 1";
          const team2Name = rec.team2Name || "Команда 2";
          const score1 = rec.finalTeam1Score ?? 0;
          const score2 = rec.finalTeam2Score ?? 0;

          return (
            <div key={rec.id} className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
              <div className="flex items-start justify-between mb-2">
                <div className="cursor-pointer flex-1 mr-2" onClick={() => toggleExpand(rec.id)}>
                  <div className="text-[10px] uppercase opacity-60 flex items-center gap-1 flex-wrap">
                    <span>{rec.date}</span>
                    {rec.event && <span>· {rec.event}</span>}
                    {rec.format && FORMATS[rec.format] && <span>· {FORMATS[rec.format].label}</span>}
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
                  <button onClick={() => onShare(rec)} className="p-1.5 rounded border opacity-70" style={{ borderColor: BORDER }} title="Поделиться">
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(isDeleting ? null : rec.id)}
                    className="p-1.5 rounded border opacity-70"
                    style={{ borderColor: BORDER, color: BAD }}
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => toggleExpand(rec.id)} className="p-1.5 rounded border opacity-70" style={{ borderColor: BORDER }} title="Детали">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {isDeleting && (
                <div className="mt-2 p-2 rounded border text-xs" style={{ borderColor: BAD, backgroundColor: "#fbe9e7" }}>
                  <div className="font-semibold mb-1.5" style={{ color: BAD }}>
                    Удалить эту партию из истории?
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
                      Удалить
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 rounded font-bold border" style={{ borderColor: BORDER }}>
                      Отмена
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
    </div>
  );
}
