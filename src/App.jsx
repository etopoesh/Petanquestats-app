import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, X, ClipboardList, BarChart3, History, ChevronLeft, Share2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const INK = "#262421";
const PAPER = "#E9E4D8";
const PINE = "#2F5233";
const PINE_DARK = "#1F3A24";
const BRONZE = "#B07A3E";
const GOOD = "#3C7A4B";
const BAD = "#A23B32";
const YELLOW = "#C8860D";
const CARD = "#F1EEE5";
const BORDER = "#c9c2b0";

// balls = сколько шаров бросает КАЖДЫЙ игрок за гейм (не команда)
const FORMATS = {
  triplet: { label: "Триплет", team1: 3, team2: 3, balls: 2 },
  doublet: { label: "Дуплет", team1: 2, team2: 2, balls: 3 },
  tete: { label: "Тет-а-тет", team1: 1, team2: 1, balls: 3 },
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
    const next = (arr || []).slice(0, n);
    while (next.length < n) next.push("");
    return next;
  };
  return {
    ...draft,
    format: newFormat,
    team1Players: resize(draft.team1Players, cfg.team1),
    team2Players: resize(draft.team2Players, cfg.team2),
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

// Дистанция — три именованные зоны вместо числовых меток
const DIST_ZONES = [
  { key: "near", label: "Ближняя", hint: "≤ 7 м", test: (d) => d <= 7 },
  { key: "mid", label: "Средняя", hint: "7.1 – 8.5 м", test: (d) => d > 7 && d <= 8.5 },
  { key: "far", label: "Дальняя", hint: "≥ 8.51 м", test: (d) => d > 8.5 },
];

function zoneFor(dist) {
  const d = parseFloat(String(dist).replace(",", "."));
  if (isNaN(d)) return null;
  return DIST_ZONES.find((z) => z.test(d)) || null;
}

function calcDistanceZones(throws, teamTag) {
  const out = { point: {}, tir: {} };
  DIST_ZONES.forEach((z) => {
    out.point[z.key] = { total: 0, success: 0 };
    out.tir[z.key] = { total: 0, success: 0 };
  });
  throws
    .filter((t) => t.team === teamTag)
    .forEach((t) => {
      const z = zoneFor(t.distance);
      if (!z || (t.type !== "point" && t.type !== "tir")) return;
      const bucket = out[t.type][z.key];
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
        if (data.match) setMatch(data.match);
        if (data.geimState) setGeimState(data.geimState);
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

  const ballsUsed = (player) => throws.filter((t) => t.player === player && t.geim === geimState.geim).length;

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

    const cfg = FORMATS[match.format];
    const usedNow = next.filter((t) => t.player === selPlayer && t.geim === geimState.geim).length;
    if (usedNow >= cfg.balls) {
      setSelPlayer(null);
    }
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
    if (t1 >= 13 || t2 >= 13) setThirteenPrompt({ team1: t1, team2: t2 });
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

  // Полная статистика (без разбивки по дистанции), без подписи разработчика — для теста на одном телефоне
  const buildShareText = (record) => {
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
            <LabeledInput label="Событие" value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })} placeholder="Кубок города" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <LabeledInput label="Команда 1" value={draft.team1Name} onChange={(e) => setDraft({ ...draft, team1Name: e.target.value })} placeholder="Название команды 1" />
            <LabeledInput label="Команда 2" value={draft.team2Name} onChange={(e) => setDraft({ ...draft, team2Name: e.target.value })} placeholder="Название команды 2" />
          </div>

          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">
              Игроки «{draft.team1Name || "Команда 1"}»
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
              Игроки «{draft.team2Name || "Команда 2"}»
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
            <button onClick={() => setTab("history")} className="w-full py-2.5 mt-3 rounded-md font-semibold text-sm border-2" style={{ borderColor: BORDER, color: INK }}>
              История партий ({history.length})
            </button>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const cfg = FORMATS[match.format];
  const team1Name = match.team1Name || "Команда 1";
  const team2Name = match.team2Name || "Команда 2";
  const team1Players = match.team1Players || [];
  const team2Players = match.team2Players || [];
  const rawTeamPlayers = selTeam === "team1" ? team1Players : selTeam === "team2" ? team2Players : [];
  const teamPlayers = rawTeamPlayers.filter((p) => ballsUsed(p) < cfg.balls);

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
              <div className="text-[10px] opacity-50 mt-1.5">Если кошонет сдвинули — впишите новую дистанцию, гейм продолжается без сброса.</div>
            </div>

            {!endGeimOpen ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={openEndGeim} className="py-2.5 rounded-md font-bold text-white text-sm" style={{ backgroundColor: PINE }}>
                  Конец гейма
                </button>
                <button onClick={() => setConfirmEndMatch(true)} className="py-2.5 rounded-md font-bold text-sm border-2" style={{ borderColor: BAD, color: BAD }}>
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
              <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">Команда</div>
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
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">Игрок</div>
                {teamPlayers.length === 0 ? (
                  <div className="text-xs italic opacity-50 px-1">Все шары этой команды в гейме разыграны</div>
                ) : (
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
                )}
              </div>
            )}

            {selPlayer && (
              <div className="mb-3">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">Тип броска</div>
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
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">Результат</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => logThrow("success")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: GOOD }}>
                    Успех
                  </button>
                  <button onClick={() => logThrow("fail")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: BAD }}>
                    Неуспех
                  </button>
                </div>
              </div>
            )}

            {selType === "tir" && (
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">Результат</div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => logThrow("miss")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: BAD }}>
                    Промах
                  </button>
                  <button onClick={() => logThrow("hit")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: GOOD }}>
                    Попадание
                  </button>
                  <button onClick={() => logThrow("carreau")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: YELLOW }}>
                    Каро
                  </button>
                </div>
              </div>
            )}

            {throws.length > 0 && (
              <div className="mt-4 rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase opacity-70">Броски текущей партии</div>
                  <button onClick={undoLast} className="flex items-center gap-1 text-xs font-semibold opacity-70">
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
                          <span className="font-bold">{t.player}</span> ({t.team === "team1" ? team1Name : team2Name}): {t.type === "point" ? "пойнт" : "тир"} —{" "}
                          <span
                            className="font-bold"
                            style={{
                              color:
                                t.result === "carreau" ? YELLOW : t.result === "success" || t.result === "hit" ? GOOD : BAD,
                            }}
                          >
                            {t.result === "success" || t.result === "hit" ? "успех" : t.result === "carreau" ? "каро" : "промах"}
                          </span>
                          {t.distance ? ` [${t.distance}м]` : ""}
                        </div>
                        <button onClick={() => deleteThrow(t.id)} className="opacity-40 p-0.5">
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

      <Footer />

      <div className="fixed bottom-0 left-0 right-0 border-t-2 bg-white" style={{ borderColor: BORDER }}>
        <div className="max-w-md mx-auto grid grid-cols-3">
          <button onClick={() => setTab("log")} className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold" style={{ color: tab === "log" ? PINE : "#8a8375" }}>
            <ClipboardList size={18} />
            Запись
          </button>
          <button onClick={() => setTab("stats")} className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold" style={{ color: tab === "stats" ? PINE : "#8a8375" }}>
            <BarChart3 size={18} />
            Статистика
          </button>
          <button onClick={() => setTab("history")} className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold" style={{ color: tab === "history" ? PINE : "#8a8375" }}>
            <History size={18} />
            История
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- STATS (карточный вид — оригинальный дизайн) ----------------

function StatsBlock({ title, players, throws, gameScores, teamTag, accent }) {
  const [gridMode, setGridMode] = useState(null); // null | 'team' | <playerName>
  const teamRows = players.map((p) => ({ name: p, s: calcPlayerStats(throws, p) }));
  const total = sumStats(teamRows.map((r) => r.s));
  const zones = calcDistanceZones(throws, teamTag);
  const teamThrows = throws.filter((t) => t.team === teamTag);

  return (
    <div className="mb-6">
      <button
        onClick={() => setGridMode(gridMode === "team" ? null : "team")}
        className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wide mb-2 pb-1 border-b-2"
        style={{ color: accent, borderColor: accent }}
      >
        {title}
        {gridMode === "team" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {gridMode === "team" && <ThrowGrid throws={teamThrows} allThrows={throws} gameScores={gameScores} />}
      <div className="space-y-2 mb-3">
        <PlayerCard name="Итого" s={total} bold accent={accent} />
        {teamRows.map((r) => (
          <React.Fragment key={r.name}>
            <PlayerCard
              name={r.name}
              s={r.s}
              accent={accent}
              clickable
              active={gridMode === r.name}
              onClick={() => setGridMode(gridMode === r.name ? null : r.name)}
            />
            {gridMode === r.name && <ThrowGrid throws={throws.filter((t) => t.player === r.name)} allThrows={throws} gameScores={gameScores} />}
          </React.Fragment>
        ))}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 opacity-60">По дистанции</div>
      <div className="grid grid-cols-3 gap-2">
        {DIST_ZONES.map((z) => {
          const pt = zones.point[z.key];
          const tr = zones.tir[z.key];
          return (
            <div key={z.key} className="rounded-lg p-2 text-center" style={{ backgroundColor: CARD }}>
              <div className="text-[10px] font-bold uppercase">{z.label}</div>
              <div className="text-[9px] opacity-50 mb-1">{z.hint}</div>
              <div className="text-[10px]">
                П: <span className="font-black">{pct(pt.success, pt.total)}</span>
              </div>
              <div className="text-[10px]">
                Т: <span className="font-black">{pct(tr.success, tr.total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayerCard({ name, s, bold, accent, clickable, active, onClick }) {
  return (
    <div className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: active ? accent : bold ? accent : "#dcd6c8" }}>
      {clickable ? (
        <button onClick={onClick} className="w-full flex items-center justify-between mb-2">
          <span className="text-sm font-bold">{name}</span>
          {active ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : (
        <div className={`text-sm mb-2 ${bold ? "font-black" : "font-bold"}`}>{name}</div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatCell label="Тир" value={`${s.tirSuccess}/${s.tirTotal}`} pctVal={pct(s.tirSuccess, s.tirTotal)} />
        <StatCell label="Каро" value={`${s.carreau}/${s.tirTotal}`} pctVal={pct(s.carreau, s.tirTotal)} />
        <StatCell label="Пойнт" value={`${s.pointSuccess}/${s.pointTotal}`} pctVal={pct(s.pointSuccess, s.pointTotal)} />
        <StatCell label="1й пойнт" value={`${s.firstPointSuccess}/${s.firstPointTotal}`} pctVal={pct(s.firstPointSuccess, s.firstPointTotal)} />
      </div>
    </div>
  );
}

// Сетка бросков: колонка = один бросок в хронологическом порядке.
// Пойнт и тир — в отдельных строках; пустая ячейка помечена буквой типа, который выпал в этой колонке.
function ThrowGrid({ throws, allThrows, gameScores }) {
  const geims = [...new Set(throws.map((t) => t.geim))].sort((a, b) => a - b);

  if (geims.length === 0) {
    return <div className="text-xs italic opacity-50 px-2 py-3">Нет бросков</div>;
  }

  const cellColor = (t) => {
    if (!t) return null;
    if (t.type === "point") return t.result === "success" ? GOOD : BAD;
    if (t.result === "carreau") return YELLOW;
    return t.result === "hit" ? GOOD : BAD;
  };

  const startScoreFor = (g) => {
    if (g <= 1) return { team1: 0, team2: 0 };
    const prev = (gameScores || []).find((s) => s.geim === g - 1);
    return prev ? { team1: prev.team1Score, team2: prev.team2Score } : { team1: 0, team2: 0 };
  };

  return (
    <div className="mb-3 rounded-lg p-2 overflow-x-auto" style={{ backgroundColor: CARD }}>
      <div className="inline-flex gap-3">
        {geims.map((g) => {
          const geimThrows = throws.filter((t) => t.geim === g);
          const firstOfGeim = allThrows.find((t) => t.geim === g);
          const dist = firstOfGeim && firstOfGeim.distance ? `${firstOfGeim.distance}м` : "—";
          const score = startScoreFor(g);
          return (
            <div key={g} className="flex flex-col items-center shrink-0">
              <div className="text-[9px] font-bold text-center leading-tight mb-1 whitespace-nowrap">
                {g}. {score.team1}:{score.team2} {dist}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {geimThrows.map((t, i) => {
                    const c = t.type === "point" ? cellColor(t) : null;
                    return (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm flex items-center justify-center"
                        style={{ backgroundColor: c || "transparent", border: c ? "none" : `1px solid ${BORDER}` }}
                      >
                        {!c && <span className="text-[8px] font-bold opacity-40">п</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {geimThrows.map((t, i) => {
                    const c = t.type === "tir" ? cellColor(t) : null;
                    return (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm flex items-center justify-center"
                        style={{ backgroundColor: c || "transparent", border: c ? "none" : `1px solid ${BORDER}` }}
                      >
                        {!c && <span className="text-[8px] font-bold opacity-40">т</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCell({ label, value, pctVal }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded" style={{ backgroundColor: CARD }}>
      <div>
        <div className="text-[10px] uppercase tracking-wide opacity-60">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
      <div className="text-base font-black">{pctVal}</div>
    </div>
  );
}

function StatsPanel({ match, throws, gameScores }) {
  const team1Name = match.team1Name || "Команда 1";
  const team2Name = match.team2Name || "Команда 2";
  const team1Players = match.team1Players || [];
  const team2Players = match.team2Players || [];
  const safeThrows = throws || [];
  const safeScores = gameScores || [];
  return (
    <div>
      <h2 className="text-xl font-black mb-1">Обзор</h2>
      <div className="text-xs opacity-60 mb-4">{FORMATS[match.format]?.label}</div>
      <StatsBlock title={team1Name} players={team1Players} throws={safeThrows} gameScores={safeScores} teamTag="team1" accent={PINE} />
      <StatsBlock title={team2Name} players={team2Players} throws={safeThrows} gameScores={safeScores} teamTag="team2" accent={BRONZE} />
    </div>
  );
}

// ---------------- HISTORY ----------------

function HistoryPanel({ history, onShare, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  if (!history || history.length === 0) {
    return <div className="text-sm opacity-60 text-center py-8">История партий пуста</div>;
  }

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div>
      <h2 className="text-xl font-black mb-3">История партий</h2>
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
    </div>
  );
}

