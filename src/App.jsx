import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, X, ClipboardList, BarChart3, History, ChevronLeft, Share2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const INK = "#262421";
const PAPER = "#E9E4D8";
const PINE = "#2F5233";
const PINE_DARK = "#1F3A24";
const BRONZE = "#B07A3E";
const GOOD = "#3C7A4B";
const BAD = "#A23B32";
const CARD = "#F1EEE5";
const BORDER = "#c9c2b0";

const FORMATS = {
  triplet: { label: "Триплет", team1: 3, team2: 3, balls: 2 },
  doublet: { label: "Дуплет", team1: 2, team2: 2, balls: 3 },
  tete: { label: "Тет-а-тет", team1: 1, team2: 1, balls: 6 },
};

const CUR_KEY = "petanque_current_v2";
const HIST_KEY = "petanque_history_v2";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft() {
  return {
    format: "triplet",
    date: todayISO(),
    event: "",
    team1Name: "",
    team2Name: "",
    team1Players: Array(3).fill(""),
    team2Players: Array(3).fill(""),
  };
}

function withFormat(draft, newFormat) {
  const cfg = FORMATS[newFormat];
  const resize = (arr, n) => {
    const next = arr.slice(0, n);
    while (next.length < n) next.push("");
    return next;
  };
  return {
    ...draft,
    format: newFormat,
    team1Players: resize(draft.team1Players || [], cfg.team1),
    team2Players: resize(draft.team2Players || [], cfg.team2),
  };
}

function pct(n, d) {
  if (!d) return "—";
  return Math.round((n / d) * 100) + "%";
}

function calcPlayerStats(throws, playerName) {
  const rows = throws.filter((t) => t.player === playerName);
  const tirs = rows.filter((t) => t.type === "tir");
  const points = rows.filter((t) => t.type === "point");
  const tirSuccess = tirs.filter((t) => t.result === "hit" || t.result === "carreau").length;
  const carreau = tirs.filter((t) => t.result === "carreau").length;
  const pointSuccess = points.filter((t) => t.result === "success").length;
  const firstPoints = rows.filter((t) => t.firstPoint);
  const firstPointSuccess = firstPoints.filter((t) => t.result === "success").length;
  return {
    tirTotal: tirs.length,
    tirSuccess,
    carreau,
    pointTotal: points.length,
    pointSuccess,
    firstPointTotal: firstPoints.length,
    firstPointSuccess,
  };
}

function sumStats(list) {
  return list.reduce(
    (acc, s) => ({
      tirTotal: acc.tirTotal + s.tirTotal,
      tirSuccess: acc.tirSuccess + s.tirSuccess,
      carreau: acc.carreau + s.carreau,
      pointTotal: acc.pointTotal + s.pointTotal,
      pointSuccess: acc.pointSuccess + s.pointSuccess,
      firstPointTotal: acc.firstPointTotal + s.firstPointTotal,
      firstPointSuccess: acc.firstPointSuccess + s.firstPointSuccess,
    }),
    { tirTotal: 0, tirSuccess: 0, carreau: 0, pointTotal: 0, pointSuccess: 0, firstPointTotal: 0, firstPointSuccess: 0 }
  );
}

const DIST_BUCKETS = [
  { label: "6 – 7.5 м", min: 6, max: 7.5 },
  { label: "7.5 – 8.5 м", min: 7.5, max: 8.5 },
  { label: "8.5 – 10 м", min: 8.5, max: 10.001 },
];

function bucketFor(dist) {
  const d = parseFloat(String(dist).replace(",", "."));
  if (isNaN(d)) return null;
  return DIST_BUCKETS.find((b) => d >= b.min && d < b.max) || null;
}

function calcDistanceBuckets(throws, teamTag, legacyTag = "") {
  const out = { point: {}, tir: {} };
  DIST_BUCKETS.forEach((b) => {
    out.point[b.label] = { total: 0, success: 0 };
    out.tir[b.label] = { total: 0, success: 0 };
  });
  throws
    .filter((t) => t.team === teamTag || (legacyTag && t.team === legacyTag))
    .forEach((t) => {
      const b = bucketFor(t.distance);
      if (!b || (t.type !== "point" && t.type !== "tir")) return;
      const bucket = out[t.type][b.label];
      bucket.total++;
      const ok = t.type === "point" ? t.result === "success" : t.result === "hit" || t.result === "carreau";
      if (ok) bucket.success++;
    });
  return out;
}

function Footer() {
  return <div className="text-center italic text-[10px] opacity-40 py-4">Équipe Radius</div>;
}

function LabeledInput({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</label>
      <input {...props} className="w-full mt-1 px-2 py-2 rounded-md border-2 bg-white text-sm" style={{ borderColor: BORDER }} />
    </div>
  );
}

export default function App() {
  const [match, setMatch] = useState(null);
  const [geimState, setGeimState] = useState({ geim: 1, team1Score: 0, team2Score: 0, distance: "" });
  const [throws, setThrows] = useState([]);
  const [gameScores, setGameScores] = useState([]);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("log");
  const [draft, setDraft] = useState(emptyDraft());
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [selType, setSelType] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [endGeimOpen, setEndGeimOpen] = useState(false);
  const [endGeimScores, setEndGeimScores] = useState({ team1: 0, team2: 0 });
  const [thirteenPrompt, setThirteenPrompt] = useState(null);
  const [confirmEndMatch, setConfirmEndMatch] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const cur = localStorage.getItem(CUR_KEY);
      if (cur) {
        const data = JSON.parse(cur);
        if (data.match) {
          // Normalize old legacy keys if necessary
          const m = data.match;
          setMatch({
            ...m,
            team1Name: m.team1Name || m.ourTeamName || "Команда 1",
            team2Name: m.team2Name || m.oppTeamName || "Команда 2",
            team1Players: m.team1Players || m.ownPlayers || [],
            team2Players: m.team2Players || m.oppPlayers || [],
          });
        }
        if (data.geimState) {
          const gs = data.geimState;
          setGeimState({
            geim: gs.geim || 1,
            team1Score: gs.team1Score ?? gs.ourScore ?? 0,
            team2Score: gs.team2Score ?? gs.theirScore ?? 0,
            distance: gs.distance || "",
          });
        }
        if (data.throws) setThrows(data.throws);
        if (data.gameScores) setGameScores(data.gameScores);
      }
    } catch (e) {}

    try {
      const hist = localStorage.getItem(HIST_KEY);
      if (hist) setHistory(JSON.parse(hist));
    } catch (e) {}

    setLoaded(true);
  }, []);

  const persistCurrent = (m, gs, th, scores) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(CUR_KEY, JSON.stringify({ match: m, geimState: gs, throws: th, gameScores: scores }));
      } catch (e) {
        console.error(e);
      }
    }, 150);
  };

  const persistHistory = (next) => {
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  const startMatch = () => {
    const cleaned = {
      ...draft,
      team1Players: draft.team1Players.map((p, i) => p.trim() || `Игрок ${i + 1}`),
      team2Players: draft.team2Players.map((p, i) => p.trim() || `Игрок ${i + 1}`),
      team1Name: draft.team1Name.trim() || "Команда 1",
      team2Name: draft.team2Name.trim() || "Команда 2",
    };
    const gs = { geim: 1, team1Score: 0, team2Score: 0, distance: "" };
    setMatch(cleaned);
    setGeimState(gs);
    setThrows([]);
    setGameScores([]);
    persistCurrent(cleaned, gs, [], []);
    setTab("log");
  };

  const updateGeim = (patch) => {
    const next = { ...geimState, ...patch };
    setGeimState(next);
    persistCurrent(match, next, throws, gameScores);
  };

  const logThrow = (result) => {
    if (!selTeam || !selPlayer || !selType) return;
    const isFirst = throws.filter((t) => t.geim === geimState.geim).length === 0;
    const entry = {
      id: Date.now() + Math.random(),
      geim: geimState.geim,
      distance: geimState.distance,
      team: selTeam,
      player: selPlayer,
      type: selType,
      result,
      firstPoint: isFirst,
    };
    const next = [...throws, entry];
    setThrows(next);
    persistCurrent(match, geimState, next, gameScores);
    setSelType(null);
  };

  const undoLast = () => {
    const next = throws.slice(0, -1);
    setThrows(next);
    persistCurrent(match, geimState, next, gameScores);
  };

  const deleteThrow = (id) => {
    const next = throws.filter((t) => t.id !== id);
    setThrows(next);
    persistCurrent(match, geimState, next, gameScores);
  };

  const openEndGeim = () => {
    setEndGeimScores({ team1: geimState.team1Score, team2: geimState.team2Score });
    setEndGeimOpen(true);
  };

  const confirmEndGeim = () => {
    const t1 = parseInt(endGeimScores.team1) || 0;
    const t2 = parseInt(endGeimScores.team2) || 0;
    const scoreEntry = { geim: geimState.geim, team1Score: t1, team2Score: t2 };
    const nextScores = [...gameScores, scoreEntry];
    const nextGeimState = { ...geimState, geim: geimState.geim + 1, team1Score: t1, team2Score: t2 };
    setGameScores(nextScores);
    setGeimState(nextGeimState);
    persistCurrent(match, nextGeimState, throws, nextScores);
    setEndGeimOpen(false);
    setSelTeam(null);
    setSelPlayer(null);
    setSelType(null);
    if (t1 >= 13 || t2 >= 13) {
      setThirteenPrompt({ team1: t1, team2: t2 });
    }
  };

  const finalizeMatch = () => {
    const record = {
      id: Date.now(),
      ...match,
      throws,
      gameScores,
      finalTeam1Score: geimState.team1Score,
      finalTeam2Score: geimState.team2Score,
      finishedAt: new Date().toISOString(),
    };
    const nextHistory = [record, ...history];
    setHistory(nextHistory);
    persistHistory(nextHistory);

    setMatch(null);
    setThrows([]);
    setGameScores([]);
    setGeimState({ geim: 1, team1Score: 0, team2Score: 0, distance: "" });
    setDraft(emptyDraft());
    persistCurrent(null, { geim: 1, team1Score: 0, team2Score: 0, distance: "" }, [], []);
    setConfirmEndMatch(false);
    setThirteenPrompt(null);
    setTab("log");
  };

  const deleteHistoryRecord = (id) => {
    const nextHistory = history.filter((rec) => rec.id !== id);
    setHistory(nextHistory);
    persistHistory(nextHistory);
  };

  const resetMatch = () => {
    setMatch(null);
    setThrows([]);
    setGameScores([]);
    setGeimState({ geim: 1, team1Score: 0, team2Score: 0, distance: "" });
    setDraft(emptyDraft());
    persistCurrent(null, { geim: 1, team1Score: 0, team2Score: 0, distance: "" }, [], []);
    setConfirmReset(false);
    setTab("log");
  };

  const buildShareText = (record) => {
    const t1Name = record.team1Name || record.ourTeamName || "Команда 1";
    const t2Name = record.team2Name || record.oppTeamName || "Команда 2";
    const t1Players = record.team1Players || record.ownPlayers || [];
    const t2Players = record.team2Players || record.oppPlayers || [];
    const t1Score = record.finalTeam1Score ?? record.finalOurScore ?? 0;
    const t2Score = record.finalTeam2Score ?? record.finalTheirScore ?? 0;

    const t1Total = sumStats(t1Players.map((p) => calcPlayerStats(record.throws || [], p)));
    const t2Total = sumStats(t2Players.map((p) => calcPlayerStats(record.throws || [], p)));

    return (
      `${record.event || "Партия"} · ${FORMATS[record.format]?.label || "Петанк"}\n` +
      `${t1Name} ${t1Score} : ${t2Score} ${t2Name}\n\n` +
      `«${t1Name}» — тир: ${pct(t1Total.tirSuccess, t1Total.tirTotal)} (каро ${pct(t1Total.carreau, t1Total.tirTotal)}), пойнт: ${pct(t1Total.pointSuccess, t1Total.pointTotal)}\n` +
      `«${t2Name}» — тир: ${pct(t2Total.tirSuccess, t2Total.tirTotal)} (каро ${pct(t2Total.carreau, t2Total.tirTotal)}), пойнт: ${pct(t2Total.pointSuccess, t2Total.pointTotal)}\n\n` +
      `Équipe Radius`
    );
  };

  const shareRecord = async (record) => {
    const text = buildShareText(record);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Статистика партии — петанк", text });
      } catch (e) {}
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
  };

  if (!loaded) {
    return (
      <div style={{ backgroundColor: PAPER, minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: INK }} className="text-sm tracking-wide">
          загрузка…
        </div>
      </div>
    );
  }

  // ---------------- SETUP SCREEN ----------------
  if (!match) {
    const cfg = FORMATS[draft.format];
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
            <LabeledInput
              label="Событие"
              value={draft.event}
              onChange={(e) => setDraft({ ...draft, event: e.target.value })}
              placeholder="Кубок города"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <LabeledInput
              label="Команда 1"
              value={draft.team1Name}
              onChange={(e) => setDraft({ ...draft, team1Name: e.target.value })}
              placeholder="Название команды 1"
            />
            <LabeledInput
              label="Команда 2"
              value={draft.team2Name}
              onChange={(e) => setDraft({ ...draft, team2Name: e.target.value })}
              placeholder="Название команды 2"
            />
          </div>

          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">
              Игроки «{draft.team1Name || "Команда 1"}» ({cfg.team1})
            </div>
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
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">
              Игроки «{draft.team2Name || "Команда 2"}» ({cfg.team2})
            </div>
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
            <button
              onClick={() => setTab("history")}
              className="w-full py-2.5 mt-3 rounded-md font-semibold text-sm border-2"
              style={{ borderColor: BORDER, color: INK }}
            >
              История партий ({history.length})
            </button>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const cfg = FORMATS[match.format];
  const team1Name = match.team1Name || match.ourTeamName || "Команда 1";
  const team2Name = match.team2Name || match.oppTeamName || "Команда 2";
  const team1Players = match.team1Players || match.ownPlayers || [];
  const team2Players = match.team2Players || match.oppPlayers || [];

  const teamPlayers = selTeam === "team1" ? team1Players : selTeam === "team2" ? team2Players : [];

  // ---------------- MAIN APP ----------------
  return (
    <div style={{ backgroundColor: PAPER, minHeight: "100vh", color: INK }} className="pb-24">
      <div className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase" style={{ color: BRONZE }}>
              {cfg.label} {match.event ? `· ${match.event}` : ""}
            </div>
            <h1 className="text-lg font-black" style={{ letterSpacing: "-0.02em" }}>
              {team1Name} <span className="opacity-40 font-normal">vs</span> {team2Name}
            </h1>
          </div>
          <button onClick={() => setConfirmReset(true)} className="text-[11px] uppercase tracking-wide opacity-60 underline shrink-0 ml-2">
            сброс
          </button>
        </div>

        {confirmReset && (
          <div className="mb-4 p-3 rounded-md border-2 text-sm" style={{ borderColor: BAD, backgroundColor: "#fbe9e7" }}>
            <div className="font-semibold mb-2">Стереть текущую партию (без сохранения в историю)?</div>
            <div className="flex gap-2">
              <button onClick={resetMatch} className="px-3 py-1.5 rounded text-white text-xs font-bold" style={{ backgroundColor: BAD }}>
                Да, стереть
              </button>
              <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded text-xs font-bold border-2" style={{ borderColor: BORDER }}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {thirteenPrompt && (
          <div className="mb-4 p-3 rounded-md border-2 text-sm" style={{ borderColor: PINE, backgroundColor: "#dfe6df" }}>
            <div className="font-semibold mb-2">
              Счёт {thirteenPrompt.team1}:{thirteenPrompt.team2} — похоже, партия завершена. Закончить партию?
            </div>
            <div className="flex gap-2">
              <button onClick={finalizeMatch} className="px-3 py-1.5 rounded text-white text-xs font-bold" style={{ backgroundColor: PINE }}>
                Да, закончить партию
              </button>
              <button onClick={() => setThirteenPrompt(null)} className="px-3 py-1.5 rounded text-xs font-bold border-2" style={{ borderColor: BORDER }}>
                Ещё нет
              </button>
            </div>
          </div>
        )}

        {confirmEndMatch && (
          <div className="mb-4 p-3 rounded-md border-2 text-sm" style={{ borderColor: PINE, backgroundColor: "#dfe6df" }}>
            <div className="font-semibold mb-2">Закончить партию сейчас и сохранить в историю?</div>
            <div className="flex gap-2">
              <button onClick={finalizeMatch} className="px-3 py-1.5 rounded text-white text-xs font-bold" style={{ backgroundColor: PINE }}>
                Да, закончить
              </button>
              <button onClick={() => setConfirmEndMatch(false)} className="px-3 py-1.5 rounded text-xs font-bold border-2" style={{ borderColor: BORDER }}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* ---- LOG TAB ---- */}
        {tab === "log" && (
          <>
            <div className="rounded-lg border-2 p-3 mb-3 bg-white" style={{ borderColor: BORDER }}>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-60">Гейм</div>
                  <div className="text-xl font-black">{geimState.geim}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-60">Счёт</div>
                  <div className="text-xl font-black">
                    {geimState.team1Score}:{geimState.team2Score}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-60">Дистанция</div>
                  <input
                    value={geimState.distance}
                    onChange={(e) => updateGeim({ distance: e.target.value })}
                    placeholder="м"
                    className="w-full mt-0.5 px-1.5 py-1 rounded border text-sm font-bold text-center"
                    style={{ borderColor: BORDER }}
                  />
                </div>
              </div>
              <div className="text-[10px] opacity-50 mt-1.5">
                Если кошонет сдвинули — впишите новую дистанцию, гейм продолжается без сброса.
              </div>
            </div>

            {!endGeimOpen ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={openEndGeim} className="py-2.5 rounded-md font-bold text-white text-sm" style={{ backgroundColor: PINE }}>
                  Конец гейма
                </button>
                <button
                  onClick={() => setConfirmEndMatch(true)}
                  className="py-2.5 rounded-md font-bold text-sm border-2"
                  style={{ borderColor: BAD, color: BAD }}
                >
                  Конец партии
                </button>
              </div>
            ) : (
              <div className="rounded-lg border-2 p-3 mb-4" style={{ borderColor: PINE, backgroundColor: "#dfe6df" }}>
                <div className="text-xs font-bold uppercase tracking-wide mb-2">Счёт после этого гейма</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-60 truncate">{team1Name}</div>
                    <input
                      type="number"
                      value={endGeimScores.team1}
                      onChange={(e) => setEndGeimScores({ ...endGeimScores, team1: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border text-lg font-black text-center"
                      style={{ borderColor: BORDER }}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide opacity-60 truncate">{team2Name}</div>
                    <input
                      type="number"
                      value={endGeimScores.team2}
                      onChange={(e) => setEndGeimScores({ ...endGeimScores, team2: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border text-lg font-black text-center"
                      style={{ borderColor: BORDER }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={confirmEndGeim} className="flex-1 py-2 rounded-md font-bold text-white text-sm" style={{ backgroundColor: PINE }}>
                    Подтвердить
                  </button>
                  <button onClick={() => setEndGeimOpen(false)} className="px-3 py-2 rounded-md font-bold text-sm border-2" style={{ borderColor: BORDER }}>
                    Отмена
                  </button>
                </div>
              </div>
            )}

            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">1. Команда</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelTeam("team1");
                    setSelPlayer(null);
                    setSelType(null);
                  }}
                  className="py-2.5 rounded-md font-bold text-sm border-2 truncate px-1"
                  style={{
                    borderColor: selTeam === "team1" ? PINE : BORDER,
                    backgroundColor: selTeam === "team1" ? PINE : "white",
                    color: selTeam === "team1" ? "white" : INK,
                  }}
                >
                  {team1Name}
                </button>
                <button
                  onClick={() => {
                    setSelTeam("team2");
                    setSelPlayer(null);
                    setSelType(null);
                  }}
                  className="py-2.5 rounded-md font-bold text-sm border-2 truncate px-1"
                  style={{
                    borderColor: selTeam === "team2" ? BRONZE : BORDER,
                    backgroundColor: selTeam === "team2" ? BRONZE : "white",
                    color: selTeam === "team2" ? "white" : INK,
                  }}
                >
                  {team2Name}
                </button>
              </div>
            </div>

            {selTeam && (
              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">2. Игрок</div>
                <div className="grid grid-cols-1 gap-2">
                  {teamPlayers.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSelPlayer(p);
                        setSelType(null);
                      }}
                      className="py-2.5 px-3 rounded-md font-semibold text-sm border-2 text-left"
                      style={{
                        borderColor: selPlayer === p ? PINE_DARK : BORDER,
                        backgroundColor: selPlayer === p ? "#dfe6df" : "white",
                        color: INK,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selPlayer && (
              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">3. Тип броска</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelType("point")}
                    className="py-2.5 rounded-md font-bold text-sm border-2"
                    style={{
                      borderColor: selType === "point" ? PINE : BORDER,
                      backgroundColor: selType === "point" ? PINE : "white",
                      color: selType === "point" ? "white" : INK,
                    }}
                  >
                    Пойнт
                  </button>
                  <button
                    onClick={() => setSelType("tir")}
                    className="py-2.5 rounded-md font-bold text-sm border-2"
                    style={{
                      borderColor: selType === "tir" ? PINE : BORDER,
                      backgroundColor: selType === "tir" ? PINE : "white",
                      color: selType === "tir" ? "white" : INK,
                    }}
                  >
                    Тир
                  </button>
                </div>
              </div>
            )}

            {selType === "point" && (
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">4. Результат</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => logThrow("success")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: GOOD }}>
                    Успех
                  </button>
                  <button onClick={() => logThrow("fail")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: BAD }}>
                    Промах
                  </button>
                </div>
              </div>
            )}

            {selType === "tir" && (
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">4. Результат</div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => logThrow("hit")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: GOOD }}>
                    Попадание
                  </button>
                  <button onClick={() => logThrow("carreau")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: BRONZE }}>
                    Каро
                  </button>
                  <button onClick={() => logThrow("fail")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: BAD }}>
                    Промах
                  </button>
                </div>
              </div>
            )}

            {throws.length > 0 && (
              <div className="mt-4 rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase opacity-70">Броски текущего гейма</div>
                  <button onClick={undoLast} className="flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100">
                    <RotateCcw size={13} /> Отмена
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {throws
                    .slice()
                    .reverse()
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs p-1.5 rounded" style={{ backgroundColor: CARD }}>
                        <div className="truncate mr-2">
                          <span className="font-bold">{t.player}</span> ({t.team === "team1" || t.team === "own" ? team1Name : team2Name}):{" "}
                          {t.type === "point" ? "пойнт" : "тир"} —{" "}
                          {t.result === "success" || t.result === "hit" ? "успех" : t.result === "carreau" ? "каро" : "промах"}
                          {t.distance ? ` [${t.distance}м]` : ""}
                        </div>
                        <button onClick={() => deleteThrow(t.id)} className="opacity-40 hover:opacity-100 p-0.5">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ---- STATS TAB ---- */}
        {tab === "stats" && <StatsPanel match={match} throws={throws} gameScores={gameScores} />}

        {/* ---- HISTORY TAB ---- */}
        {tab === "history" && <HistoryPanel history={history} onShare={shareRecord} onDelete={deleteHistoryRecord} />}
      </div>

      {/* Bottom Nav Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t-2 bg-white flex justify-around py-2 max-w-md mx-auto" style={{ borderColor: BORDER }}>
        <button
          onClick={() => setTab("log")}
          className={`flex flex-col items-center text-xs font-semibold ${tab === "log" ? "opacity-100" : "opacity-40"}`}
          style={{ color: tab === "log" ? PINE : INK }}
        >
          <ClipboardList size={18} />
          <span>Запись</span>
        </button>
        <button
          onClick={() => setTab("stats")}
          className={`flex flex-col items-center text-xs font-semibold ${tab === "stats" ? "opacity-100" : "opacity-40"}`}
          style={{ color: tab === "stats" ? PINE : INK }}
        >
          <BarChart3 size={18} />
          <span>Статистика</span>
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex flex-col items-center text-xs font-semibold ${tab === "history" ? "opacity-100" : "opacity-40"}`}
          style={{ color: tab === "history" ? PINE : INK }}
        >
          <History size={18} />
          <span>История</span>
        </button>
      </div>
    </div>
  );
}

function StatsPanel({ match, throws, gameScores }) {
  const team1Name = match.team1Name || match.ourTeamName || "Команда 1";
  const team2Name = match.team2Name || match.oppTeamName || "Команда 2";
  const team1Players = match.team1Players || match.ownPlayers || [];
  const team2Players = match.team2Players || match.oppPlayers || [];
  const safeThrows = throws || [];

  const t1Stats = team1Players.map((p) => ({ name: p, ...calcPlayerStats(safeThrows, p) }));
  const t2Stats = team2Players.map((p) => ({ name: p, ...calcPlayerStats(safeThrows, p) }));

  const t1Sum = sumStats(t1Stats);
  const t2Sum = sumStats(t2Stats);

  const t1Buckets = calcDistanceBuckets(safeThrows, "team1", "own");
  const t2Buckets = calcDistanceBuckets(safeThrows, "team2", "opp");

  return (
    <div className="space-y-4">
      {/* Сравнение команд */}
      <div className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
        <div className="text-xs font-bold uppercase mb-2" style={{ color: BRONZE }}>Командный итог</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 rounded border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
            <div className="font-bold border-b pb-1 mb-1 truncate" style={{ borderColor: BORDER }}>{team1Name}</div>
            <div>Тир: {pct(t1Sum.tirSuccess, t1Sum.tirTotal)} ({t1Sum.tirSuccess}/{t1Sum.tirTotal})</div>
            <div>Пойнт: {pct(t1Sum.pointSuccess, t1Sum.pointTotal)} ({t1Sum.pointSuccess}/{t1Sum.pointTotal})</div>
          </div>
          <div className="p-2 rounded border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
            <div className="font-bold border-b pb-1 mb-1 truncate" style={{ borderColor: BORDER }}>{team2Name}</div>
            <div>Тир: {pct(t2Sum.tirSuccess, t2Sum.tirTotal)} ({t2Sum.tirSuccess}/{t2Sum.tirTotal})</div>
            <div>Пойнт: {pct(t2Sum.pointSuccess, t2Sum.pointTotal)} ({t2Sum.pointSuccess}/{t2Sum.pointTotal})</div>
          </div>
        </div>
      </div>

      {/* Игроки Команды 1 */}
      <div className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
        <div className="text-xs font-bold uppercase mb-2" style={{ color: BRONZE }}>Игроки — {team1Name}</div>
        <div className="space-y-2 text-xs">
          {t1Stats.map((s) => (
            <div key={s.name} className="p-2 rounded border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
              <div className="font-bold mb-1">{s.name}</div>
              <div>Тир: {pct(s.tirSuccess, s.tirTotal)} ({s.tirSuccess}/{s.tirTotal}) · Каро: {s.carreau}</div>
              <div>Пойнт: {pct(s.pointSuccess, s.pointTotal)} ({s.pointSuccess}/{s.pointTotal})</div>
              <div>1-й пойнт: {pct(s.firstPointSuccess, s.firstPointTotal)} ({s.firstPointSuccess}/{s.firstPointTotal})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Игроки Команды 2 */}
      <div className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
        <div className="text-xs font-bold uppercase mb-2" style={{ color: BRONZE }}>Игроки — {team2Name}</div>
        <div className="space-y-2 text-xs">
          {t2Stats.map((s) => (
            <div key={s.name} className="p-2 rounded border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
              <div className="font-bold mb-1">{s.name}</div>
              <div>Тир: {pct(s.tirSuccess, s.tirTotal)} ({s.tirSuccess}/{s.tirTotal}) · Каро: {s.carreau}</div>
              <div>Пойнт: {pct(s.pointSuccess, s.pointTotal)} ({s.pointSuccess}/{s.pointTotal})</div>
              <div>1-й пойнт: {pct(s.firstPointSuccess, s.firstPointTotal)} ({s.firstPointSuccess}/{s.firstPointTotal})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Дистанции Команды 1 */}
      <div className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
        <div className="text-xs font-bold uppercase mb-2" style={{ color: BRONZE }}>Дистанции — {team1Name}</div>
        <div className="space-y-1.5 text-xs">
          {DIST_BUCKETS.map((b) => {
            const pt = t1Buckets.point[b.label];
            const tr = t1Buckets.tir[b.label];
            return (
              <div key={b.label} className="p-2 rounded border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
                <div className="font-bold">{b.label}</div>
                <div>Пойнт: {pct(pt.success, pt.total)} ({pt.success}/{pt.total})</div>
                <div>Тир: {pct(tr.success, tr.total)} ({tr.success}/{tr.total})</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Дистанции Команды 2 */}
      <div className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
        <div className="text-xs font-bold uppercase mb-2" style={{ color: BRONZE }}>Дистанции — {team2Name}</div>
        <div className="space-y-1.5 text-xs">
          {DIST_BUCKETS.map((b) => {
            const pt = t2Buckets.point[b.label];
            const tr = t2Buckets.tir[b.label];
            return (
              <div key={b.label} className="p-2 rounded border" style={{ borderColor: BORDER, backgroundColor: CARD }}>
                <div className="font-bold">{b.label}</div>
                <div>Пойнт: {pct(pt.success, pt.total)} ({pt.success}/{pt.total})</div>
                <div>Тир: {pct(tr.success, tr.total)} ({tr.success}/{tr.total})</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({ history, onShare, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  if (!history || history.length === 0) {
    return <div className="text-sm opacity-60 text-center py-8">История партий пуста</div>;
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase opacity-70 mb-2">Прошедшие партии</div>
      {history.map((rec) => {
        const isExpanded = expandedId === rec.id;
        const isDeleting = deleteConfirmId === rec.id;

        const team1Name = rec.team1Name || rec.ourTeamName || "Команда 1";
        const team2Name = rec.team2Name || rec.oppTeamName || "Команда 2";
        const score1 = rec.finalTeam1Score ?? rec.finalOurScore ?? 0;
        const score2 = rec.finalTeam2Score ?? rec.finalTheirScore ?? 0;

        return (
          <div key={rec.id} className="rounded-lg border-2 p-3 bg-white transition-all" style={{ borderColor: BORDER }}>
            <div className="flex items-start justify-between mb-2">
              <div className="cursor-pointer flex-1 mr-2" onClick={() => toggleExpand(rec.id)}>
                <div className="text-[10px] uppercase opacity-60 flex items-center gap-1">
                  <span>{rec.date}</span>
                  {rec.event && <span>· {rec.event}</span>}
                  {rec.format && FORMATS[rec.format] && <span>· {FORMATS[rec.format].label}</span>}
                </div>
                <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  <span>{team1Name}</span>
                  <span className="font-black">{score1} : {score2}</span>
                  <span>{team2Name}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onShare(rec)}
                  className="p-1.5 rounded border opacity-70 hover:opacity-100"
                  style={{ borderColor: BORDER }}
                  title="Поделиться"
                >
                  <Share2 size={14} />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(isDeleting ? null : rec.id)}
                  className="p-1.5 rounded border opacity-70 hover:opacity-100"
                  style={{ borderColor: BORDER, color: BAD }}
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => toggleExpand(rec.id)}
                  className="p-1.5 rounded border opacity-70 hover:opacity-100"
                  style={{ borderColor: BORDER }}
                  title="Детали"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {isDeleting && (
              <div className="mt-2 p-2 rounded border text-xs bg-red-50" style={{ borderColor: BAD }}>
                <div className="font-semibold mb-1.5" style={{ color: BAD }}>Удалить эту партию из истории?</div>
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
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-2.5 py-1 rounded font-bold border"
                    style={{ borderColor: BORDER }}
                  >
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
  );
}
