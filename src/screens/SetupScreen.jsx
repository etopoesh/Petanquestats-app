import { ChevronLeft } from "lucide-react";
import { FORMATS, PAPER, INK, PINE, BRONZE, BORDER } from "../constants";
import { withFormat } from "../utils/match";
import LabeledInput from "../components/LabeledInput";
import Footer from "../components/Footer";
import HistoryPanel from "../components/HistoryPanel";

export default function SetupScreen({ draft, setDraft, history, tab, setTab, startMatch, shareRecord, deleteHistoryRecord }) {
  if (tab === "history") {
    return (
      <div style={{ backgroundColor: PAPER, minHeight: "100vh", color: INK }} className="flex flex-col">
        <div className="max-w-md mx-auto px-5 pt-8 flex-1 w-full">
          <button onClick={() => setTab("log")} className="flex items-center gap-1 text-xs font-semibold mb-3 opacity-70">
            <ChevronLeft size={14} /> назад
          </button>
          <HistoryPanel history={history} onShare={shareRecord} onDelete={deleteHistoryRecord} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PAPER, minHeight: "100vh", color: INK }} className="flex flex-col">
      <div className="max-w-md mx-auto px-5 pt-8 flex-1 w-full">
        <div className="mb-1 text-[11px] tracking-[0.2em] uppercase" style={{ color: BRONZE }}>
          Новая партия
        </div>
        <h1 className="text-2xl font-black mb-6" style={{ letterSpacing: "-0.02em" }}>
          Игровые данные
        </h1>

        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">Формат игры</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(FORMATS).map(([key, f]) => (
              <button
                key={key}
                onClick={() => setDraft(withFormat(draft, key))}
                className="py-2.5 rounded-md text-sm font-bold border-2 transition"
                style={{
                  borderColor: draft.format === key ? PINE : BORDER,
                  backgroundColor: draft.format === key ? PINE : "transparent",
                  color: draft.format === key ? "white" : INK,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <LabeledInput label="Дата" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          <LabeledInput label="Событие" value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })} placeholder="Кубок города" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <LabeledInput label="Команда 1" value={draft.team1Name} onChange={(e) => setDraft({ ...draft, team1Name: e.target.value })} placeholder="Название команды 1" />
          <LabeledInput label="Команда 2" value={draft.team2Name} onChange={(e) => setDraft({ ...draft, team2Name: e.target.value })} placeholder="Название команды 2" />
        </div>

        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">Игроки «{draft.team1Name || "Команда 1"}»</div>
          <div className="space-y-2">
            {draft.team1Players.map((p, i) => (
              <input
                key={i}
                value={p}
                onChange={(e) => {
                  const arr = [...draft.team1Players];
                  arr[i] = e.target.value;
                  setDraft({ ...draft, team1Players: arr });
                }}
                placeholder={`Игрок ${i + 1} — имя фамилия`}
                className="w-full px-3 py-2 rounded-md border-2 bg-white text-sm"
                style={{ borderColor: BORDER }}
              />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">Игроки «{draft.team2Name || "Команда 2"}»</div>
          <div className="space-y-2">
            {draft.team2Players.map((p, i) => (
              <input
                key={i}
                value={p}
                onChange={(e) => {
                  const arr = [...draft.team2Players];
                  arr[i] = e.target.value;
                  setDraft({ ...draft, team2Players: arr });
                }}
                placeholder={`Игрок ${i + 1} — имя фамилия`}
                className="w-full px-3 py-2 rounded-md border-2 bg-white text-sm"
                style={{ borderColor: BORDER }}
              />
            ))}
          </div>
        </div>

        <button onClick={startMatch} className="w-full py-3 rounded-md font-bold text-white text-sm tracking-wide" style={{ backgroundColor: PINE }}>
          Начать партию
        </button>

        {history.length > 0 && (
          <button onClick={() => setTab("history")} className="w-full py-2.5 mt-3 rounded-md font-semibold text-sm border-2" style={{ borderColor: BORDER, color: INK }}>
            История партий ({history.length})
          </button>
        )}
      </div>
      <Footer />
    </div>
  );
}
