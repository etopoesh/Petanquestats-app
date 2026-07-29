import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, X, ClipboardList, BarChart3 } from "lucide-react";

const INK = "#262421";
const PAPER = "#E9E4D8";
const PINE = "#2F5233";
const PINE_DARK = "#1F3A24";
const BRONZE = "#B07A3E";
const GOOD = "#3C7A4B";
const BAD = "#A23B32";

const FORMATS = {
  triplet: { label: "Триплет", own: 3, opp: 3, balls: 2 },
  doublet: { label: "Дуплет", own: 2, opp: 2, balls: 3 },
  tete: { label: "Тет-а-тет", own: 1, opp: 1, balls: 6 },
};

const STORAGE_KEY = "petanque_match_v1";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function emptyMatch(format) {
  const cfg = FORMATS[format];
  return {
    format,
    date: todayISO(),
    tournament: "",
    opponentTeam: "",
    ownPlayers: Array(cfg.own).fill(""),
    oppPlayers: Array(cfg.opp).fill(""),
  };
}

function calcStats(throws, playerName) {
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

function pct(n, d) {
  if (!d) return "—";
  return Math.round((n / d) * 100) + "%";
}

function Badge({ children, tone }) {
  const bg = tone === "good" ? GOOD : tone === "bad" ? BAD : "#6b6355";
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold text-white"
      style={{ backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

export default function App() {
  const [match, setMatch] = useState(null);
  const [gameState, setGameState] = useState({ mene: 1, ourScore: 0, theirScore: 0, distance: "" });
  const [throws, setThrows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("log");
  const [setupFormat, setSetupFormat] = useState("triplet");
  const [setupDraft, setSetupDraft] = useState(emptyMatch("triplet"));
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [selType, setSelType] = useState(null);
  const [flash, setFlash] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.match) setMatch(data.match);
        if (data.gameState) setGameState(data.gameState);
        if (data.throws) setThrows(data.throws);
      }
    } catch (e) {
      console.error("Ошибка загрузки данных", e);
    }
    setLoaded(true);
  }, []);

  const persist = (nextMatch, nextGameState, nextThrows) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ match: nextMatch, gameState: nextGameState, throws: nextThrows })
        );
      } catch (e) {
        console.error("Ошибка сохранения", e);
      }
    }, 150);
  };

  const startMatch = () => {
    const cleaned = {
      ...setupDraft,
      ownPlayers: setupDraft.ownPlayers.map((p, i) => p.trim() || `Игрок ${i + 1}`),
      oppPlayers: setupDraft.oppPlayers.map((p, i) => p.trim() || `Соперник ${i + 1}`),
    };
    const gs = { mene: 1, ourScore: 0, theirScore: 0, distance: "" };
    setMatch(cleaned);
    setGameState(gs);
    setThrows([]);
    persist(cleaned, gs, []);
  };

  const updateGameState = (patch) => {
    const next = { ...gameState, ...patch };
    setGameState(next);
    persist(match, next, throws);
  };

  const logThrow = (result) => {
    if (!selTeam || !selPlayer || !selType) return;
    const isFirst = throws.filter((t) => t.mene === gameState.mene).length === 0;
    const entry = {
      id: Date.now() + Math.random(),
      mene: gameState.mene,
      ourScore: gameState.ourScore,
      theirScore: gameState.theirScore,
      distance: gameState.distance,
      team: selTeam,
      player: selPlayer,
      type: selType,
      result,
      firstPoint: isFirst,
    };
    const next = [...throws, entry];
    setThrows(next);
    persist(match, gameState, next);
    setSelType(null);
    setFlash(entry);
    setTimeout(() => setFlash(null), 900);
  };

  const undoLast = () => {
    const next = throws.slice(0, -1);
    setThrows(next);
    persist(match, gameState, next);
  };

  const deleteThrow = (id) => {
    const next = throws.filter((t) => t.id !== id);
    setThrows(next);
    persist(match, gameState, next);
  };

  const resetMatch = () => {
    setMatch(null);
    setThrows([]);
    setGameState({ mene: 1, ourScore: 0, theirScore: 0, distance: "" });
    setSetupDraft(emptyMatch("triplet"));
    setSetupFormat("triplet");
    persist(null, { mene: 1, ourScore: 0, theirScore: 0, distance: "" }, []);
    setConfirmReset(false);
    setTab("log");
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

  if (!match) {
    const cfg = FORMATS[setupFormat];
    return (
      <div style={{ backgroundColor: PAPER, minHeight: "100vh", color: INK }} className="pb-10">
        <div className="max-w-md mx-auto px-5 pt-8">
          <div className="mb-1 text-[11px] tracking-[0.2em] uppercase" style={{ color: BRONZE }}>
            Новый матч
          </div>
          <h1 className="text-2xl font-black mb-6" style={{ letterSpacing: "-0.02em" }}>
            Лист учёта — петанк
          </h1>

          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">Формат игры</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(FORMATS).map(([key, f]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSetupFormat(key);
                    setSetupDraft(emptyMatch(key));
                  }}
                  className="py-2.5 rounded-md text-sm font-bold border-2 transition"
                  style={{
                    borderColor: setupFormat === key ? PINE : "#c9c2b0",
                    backgroundColor: setupFormat === key ? PINE : "transparent",
                    color: setupFormat === key ? "white" : INK,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Дата</label>
              <input
                type="date"
                value={setupDraft.date}
                onChange={(e) => setSetupDraft({ ...setupDraft, date: e.target.value })}
                className="w-full mt-1 px-2 py-2 rounded-md border-2 bg-white text-sm"
                style={{ borderColor: "#c9c2b0" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Турнир</label>
              <input
                value={setupDraft.tournament}
                onChange={(e) => setSetupDraft({ ...setupDraft, tournament: e.target.value })}
                placeholder="Кубок города"
                className="w-full mt-1 px-2 py-2 rounded-md border-2 bg-white text-sm"
                style={{ borderColor: "#c9c2b0" }}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold uppercase tracking-wide opacity-70">Команда соперника</label>
            <input
              value={setupDraft.opponentTeam}
              onChange={(e) => setSetupDraft({ ...setupDraft, opponentTeam: e.target.value })}
              placeholder="Название команды"
              className="w-full mt-1 px-2 py-2 rounded-md border-2 bg-white text-sm"
              style={{ borderColor: "#c9c2b0" }}
            />
          </div>

          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">
              Наши игроки ({cfg.own})
            </div>
            <div className="space-y-2">
              {setupDraft.ownPlayers.map((p, i) => (
                <input
                  key={i}
                  value={p}
                  onChange={(e) => {
                    const arr = [...setupDraft.ownPlayers];
                    arr[i] = e.target.value;
                    setSetupDraft({ ...setupDraft, ownPlayers: arr });
                  }}
                  placeholder={`Игрок ${i + 1}`}
                  className="w-full px-3 py-2 rounded-md border-2 bg-white text-sm"
                  style={{ borderColor: "#c9c2b0" }}
                />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">
              Игроки соперника ({cfg.opp})
            </div>
            <div className="space-y-2">
              {setupDraft.oppPlayers.map((p, i) => (
                <input
                  key={i}
                  value={p}
                  onChange={(e) => {
                    const arr = [...setupDraft.oppPlayers];
                    arr[i] = e.target.value;
                    setSetupDraft({ ...setupDraft, oppPlayers: arr });
                  }}
                  placeholder={`Соперник ${i + 1}`}
                  className="w-full px-3 py-2 rounded-md border-2 bg-white text-sm"
                  style={{ borderColor: "#c9c2b0" }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={startMatch}
            className="w-full py-3 rounded-md font-bold text-white text-sm tracking-wide"
            style={{ backgroundColor: PINE }}
          >
            Начать матч
          </button>
        </div>
      </div>
    );
  }

  const cfg = FORMATS[match.format];
  const teamPlayers = selTeam === "own" ? match.ownPlayers : selTeam === "opp" ? match.oppPlayers : [];

  return (
    <div style={{ backgroundColor: PAPER, minHeight: "100vh", color: INK }} className="pb-24">
      <div className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase" style={{ color: BRONZE }}>
              {cfg.label} · {match.opponentTeam || "соперник"}
            </div>
            <h1 className="text-xl font-black" style={{ letterSpacing: "-0.02em" }}>
              Учёт матча
            </h1>
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="text-[11px] uppercase tracking-wide opacity-60 underline"
          >
            новый матч
          </button>
        </div>

        {confirmReset && (
          <div className="mb-4 p-3 rounded-md border-2 text-sm" style={{ borderColor: BAD, backgroundColor: "#fbe9e7" }}>
            <div className="font-semibold mb-2">Стереть текущий матч и начать новый?</div>
            <div className="flex gap-2">
              <button onClick={resetMatch} className="px-3 py-1.5 rounded text-white text-xs font-bold" style={{ backgroundColor: BAD }}>
                Да, стереть
              </button>
              <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded text-xs font-bold border-2" style={{ borderColor: "#c9c2b0" }}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {tab === "log" && (
          <>
            <div className="rounded-lg border-2 p-3 mb-4 bg-white" style={{ borderColor: "#c9c2b0" }}>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-60">Мена</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={gameState.mene}
                      onChange={(e) => updateGameState({ mene: parseInt(e.target.value) || 1 })}
                      className="w-full px-1.5 py-1 rounded border text-sm font-bold text-center"
                      style={{ borderColor: "#c9c2b0" }}
                    />
                    <button
                      onClick={() => updateGameState({ mene: gameState.mene + 1 })}
                      className="px-2 py-1 rounded text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: PINE }}
                    >
                      +1
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-60">Счёт наш:их</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={gameState.ourScore}
                      onChange={(e) => updateGameState({ ourScore: parseInt(e.target.value) || 0 })}
                      className="w-full px-1 py-1 rounded border text-sm font-bold text-center"
                      style={{ borderColor: "#c9c2b0" }}
                    />
                    <span className="opacity-50 text-xs">:</span>
                    <input
                      type="number"
                      value={gameState.theirScore}
                      onChange={(e) => updateGameState({ theirScore: parseInt(e.target.value) || 0 })}
                      className="w-full px-1 py-1 rounded border text-sm font-bold text-center"
                      style={{ borderColor: "#c9c2b0" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide opacity-60">Дистанция</div>
                  <input
                    value={gameState.distance}
                    onChange={(e) => updateGameState({ distance: e.target.value })}
                    placeholder="м"
                    className="w-full mt-0.5 px-1.5 py-1 rounded border text-sm font-bold text-center"
                    style={{ borderColor: "#c9c2b0" }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">1. Команда</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelTeam("own");
                    setSelPlayer(null);
                    setSelType(null);
                  }}
                  className="py-2.5 rounded-md font-bold text-sm border-2"
                  style={{
                    borderColor: selTeam === "own" ? PINE : "#c9c2b0",
                    backgroundColor: selTeam === "own" ? PINE : "white",
                    color: selTeam === "own" ? "white" : INK,
                  }}
                >
                  Наши
                </button>
                <button
                  onClick={() => {
                    setSelTeam("opp");
                    setSelPlayer(null);
                    setSelType(null);
                  }}
                  className="py-2.5 rounded-md font-bold text-sm border-2"
                  style={{
                    borderColor: selTeam === "opp" ? BRONZE : "#c9c2b0",
                    backgroundColor: selTeam === "opp" ? BRONZE : "white",
                    color: selTeam === "opp" ? "white" : INK,
                  }}
                >
                  Соперник
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
                        borderColor: selPlayer === p ? PINE_DARK : "#c9c2b0",
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
                      borderColor: selType === "point" ? PINE : "#c9c2b0",
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
                      borderColor: selType === "tir" ? PINE : "#c9c2b0",
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
                  <button
                    onClick={() => logThrow("success")}
                    className="py-4 rounded-md font-bold text-white text-sm"
                    style={{ backgroundColor: GOOD }}
                  >
                    Успех
                  </button>
                  <button
                    onClick={() => logThrow("fail")}
                    className="py-4 rounded-md font-bold text-white text-sm"
                    style={{ backgroundColor: BAD }}
                  >
                    Неуспех
                  </button>
                </div>
              </div>
            )}

            {selType === "tir" && (
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">4. Результат</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => logThrow("miss")}
                    className="py-4 rounded-md font-bold text-white text-sm"
                    style={{ backgroundColor: BAD }}
                  >
                    Промах
                  </button>
                  <button
                    onClick={() => logThrow("hit")}
                    className="py-4 rounded-md font-bold text-white text-sm"
                    style={{ backgroundColor: "#7a8c3c" }}
                  >
                    Попадание
                  </button>
                  <button
                    onClick={() => logThrow("carreau")}
                    className="py-4 rounded-md font-bold text-white text-sm"
                    style={{ backgroundColor: GOOD }}
                  >
                    Каро
                  </button>
                </div>
              </div>
            )}

            {flash && (
              <div
                className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg z-50"
                style={{ backgroundColor: PINE_DARK }}
              >
                записано: {flash.player} · {flash.type === "point" ? "пойнт" : "тир"}
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Последние броски</div>
                {throws.length > 0 && (
                  <button onClick={undoLast} className="flex items-center gap-1 text-xs font-semibold opacity-70">
                    <RotateCcw size={13} /> отменить
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {throws
                  .slice(-6)
                  .reverse()
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-3 py-2 rounded-md bg-white border text-sm"
                      style={{ borderColor: "#dcd6c8" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="opacity-50 text-xs shrink-0">м{t.mene}</span>
                        <span className="font-semibold truncate">{t.player}</span>
                        <span className="opacity-60 text-xs shrink-0">{t.type === "point" ? "пойнт" : "тир"}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.result === "success" || t.result === "hit" ? <Badge tone="good">+</Badge> : null}
                        {t.result === "carreau" ? <Badge tone="good">++</Badge> : null}
                        {t.result === "fail" || t.result === "miss" ? <Badge tone="bad">−</Badge> : null}
                        <button onClick={() => deleteThrow(t.id)} className="opacity-40">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                {throws.length === 0 && <div className="text-sm opacity-50 italic px-1">пока пусто</div>}
              </div>
            </div>
          </>
        )}

        {tab === "stats" && (
          <div>
            <div className="text-center mb-5">
              <div className="text-[11px] uppercase tracking-wide opacity-60">Счёт</div>
              <div className="text-3xl font-black">
                {gameState.ourScore} : {gameState.theirScore}
              </div>
              <div className="text-xs opacity-60">мена {gameState.mene}</div>
            </div>

            <StatsBlock title="Наша команда" players={match.ownPlayers} throws={throws} accent={PINE} />
            <StatsBlock title="Соперники" players={match.oppPlayers} throws={throws} accent={BRONZE} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t-2 bg-white" style={{ borderColor: "#c9c2b0" }}>
        <div className="max-w-md mx-auto grid grid-cols-2">
          <button
            onClick={() => setTab("log")}
            className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold"
            style={{ color: tab === "log" ? PINE : "#8a8375" }}
          >
            <ClipboardList size={18} />
            Запись
          </button>
          <button
            onClick={() => setTab("stats")}
            className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold"
            style={{ color: tab === "stats" ? PINE : "#8a8375" }}
          >
            <BarChart3 size={18} />
            Статистика
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsBlock({ title, players, throws, accent }) {
  const teamRows = players.map((p) => ({ name: p, s: calcStats(throws, p) }));
  const total = teamRows.reduce(
    (acc, r) => ({
      tirTotal: acc.tirTotal + r.s.tirTotal,
      tirSuccess: acc.tirSuccess + r.s.tirSuccess,
      carreau: acc.carreau + r.s.carreau,
      pointTotal: acc.pointTotal + r.s.pointTotal,
      pointSuccess: acc.pointSuccess + r.s.pointSuccess,
      firstPointTotal: acc.firstPointTotal + r.s.firstPointTotal,
      firstPointSuccess: acc.firstPointSuccess + r.s.firstPointSuccess,
    }),
    { tirTotal: 0, tirSuccess: 0, carreau: 0, pointTotal: 0, pointSuccess: 0, firstPointTotal: 0, firstPointSuccess: 0 }
  );

  return (
    <div className="mb-6">
      <div
        className="text-xs font-bold uppercase tracking-wide mb-2 pb-1 border-b-2"
        style={{ color: accent, borderColor: accent }}
      >
        {title}
      </div>
      <div className="space-y-2">
        <PlayerCard name="Итого" s={total} bold accent={accent} />
        {teamRows.map((r) => (
          <PlayerCard key={r.name} name={r.name} s={r.s} accent={accent} />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ name, s, bold, accent }) {
  return (
    <div className="rounded-lg border-2 p-3 bg-white" style={{ borderColor: bold ? accent : "#dcd6c8" }}>
      <div className={`text-sm mb-2 ${bold ? "font-black" : "font-bold"}`}>{name}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatCell label="Тир" value={`${s.tirSuccess}/${s.tirTotal}`} pctVal={pct(s.tirSuccess, s.tirTotal)} />
        <StatCell label="Каро" value={`${s.carreau}/${s.tirTotal}`} pctVal={pct(s.carreau, s.tirTotal)} />
        <StatCell label="Пойнт" value={`${s.pointSuccess}/${s.pointTotal}`} pctVal={pct(s.pointSuccess, s.pointTotal)} />
        <StatCell
          label="1й пойнт"
          value={`${s.firstPointSuccess}/${s.firstPointTotal}`}
          pctVal={pct(s.firstPointSuccess, s.firstPointTotal)}
        />
      </div>
    </div>
  );
}

function StatCell({ label, value, pctVal }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded" style={{ backgroundColor: "#F1EEE5" }}>
      <div>
        <div className="text-[10px] uppercase tracking-wide opacity-60">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
      <div className="text-base font-black">{pctVal}</div>
    </div>
  );
}