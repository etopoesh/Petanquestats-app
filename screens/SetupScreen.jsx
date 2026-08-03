import { ChevronLeft } from "lucide-react";
import { FORMATS, PAPER, INK, PINE, BRONZE, BORDER } from "../constants";
import { withFormat } from "../utils/match";
import { useLang } from "../i18n/LangContext";
import LabeledInput from "../components/LabeledInput";
import Footer from "../components/Footer";
import HistoryPanel from "../components/HistoryPanel";
import LangSwitcher from "../components/LangSwitcher";

export default function SetupScreen({ draft, setDraft, history, tab, setTab, startMatch, shareRecord, deleteHistoryRecord, importMatchRecord }) {
  const { t } = useLang();

  if (tab === "history") {
    return (
      <div style={{ backgroundColor: PAPER, minHeight: "100vh", color: INK }} className="flex flex-col">
        <div className="max-w-md mx-auto px-5 pt-8 flex-1 w-full">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setTab("log")} className="flex items-center gap-1 text-xs font-semibold opacity-70">
              <ChevronLeft size={14} /> {t("back")}
            </button>
            <LangSwitcher compact />
          </div>
          <HistoryPanel history={history} onShare={shareRecord} onDelete={deleteHistoryRecord} onImportMatch={importMatchRecord} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PAPER, minHeight: "100vh", color: INK }} className="flex flex-col">
      <div className="max-w-md mx-auto px-5 pt-8 flex-1 w-full">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] tracking-[0.2em] uppercase" style={{ color: BRONZE }}>
            {t("setup_kicker")}
          </div>
          <LangSwitcher compact />
        </div>
        <h1 className="text-2xl font-black mb-6" style={{ letterSpacing: "-0.02em" }}>
          {t("setup_title")}
        </h1>

        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">{t("format_label")}</div>
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
                {t(f.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <LabeledInput label={t("date_label")} type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          <LabeledInput label={t("event_label")} value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })} placeholder={t("event_placeholder")} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <LabeledInput label={t("team1_label")} value={draft.team1Name} onChange={(e) => setDraft({ ...draft, team1Name: e.target.value })} placeholder={t("team1_placeholder")} />
          <LabeledInput label={t("team2_label")} value={draft.team2Name} onChange={(e) => setDraft({ ...draft, team2Name: e.target.value })} placeholder={t("team2_placeholder")} />
        </div>

        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">{t("players_of", { team: draft.team1Name || t("team1_label") })}</div>
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
                placeholder={t("player_placeholder", { n: i + 1 })}
                className="w-full px-3 py-2 rounded-md border-2 bg-white text-sm"
                style={{ borderColor: BORDER }}
              />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">{t("players_of", { team: draft.team2Name || t("team2_label") })}</div>
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
                placeholder={t("player_placeholder", { n: i + 1 })}
                className="w-full px-3 py-2 rounded-md border-2 bg-white text-sm"
                style={{ borderColor: BORDER }}
              />
            ))}
          </div>
        </div>

        <button onClick={startMatch} className="w-full py-3 rounded-md font-bold text-white text-sm tracking-wide" style={{ backgroundColor: PINE }}>
          {t("start_match")}
        </button>

        {history.length > 0 && (
          <button onClick={() => setTab("history")} className="w-full py-2.5 mt-3 rounded-md font-semibold text-sm border-2" style={{ borderColor: BORDER, color: INK }}>
            {t("history_count_btn", { n: history.length })}
          </button>
        )}
      </div>
      <Footer />
    </div>
  );
}
