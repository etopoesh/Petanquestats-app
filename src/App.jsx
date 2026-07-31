import React, { useState, useEffect, useRef } from "react";
import { ClipboardList, BarChart3, History } from "lucide-react";

import { FORMATS, PAPER, INK, PINE, BRONZE, BAD, BORDER } from "./constants";
import { emptyDraft } from "./utils/match";
import { loadCurrentMatch, saveCurrentMatch, loadHistory, saveHistory } from "./services/storage";
import { shareRecord } from "./services/share";

import Footer from "./components/Footer";
import StatsPanel from "./components/StatsPanel";
import HistoryPanel from "./components/HistoryPanel";
import SetupScreen from "./screens/SetupScreen";
import LogScreen from "./screens/LogScreen";

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
    const cur = loadCurrentMatch();
    if (cur) {
      if (cur.match) setMatch(cur.match);
      if (cur.geimState) setGeimState(cur.geimState);
      if (cur.throws) setThrows(cur.throws);
      if (cur.gameScores) setGameScores(cur.gameScores);
    }
    setHistory(loadHistory());
    setLoaded(true);
  }, []);

  const persistCurrent = (m, gs, th, scores) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCurrentMatch(m, gs, th, scores), 150);
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
    if (usedNow >= cfg.balls) setSelPlayer(null);
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
    saveHistory(nextHistory);

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
    saveHistory(nextHistory);
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

  if (!loaded) {
    return (
      <div style={{ backgroundColor: PAPER }} className="flex items-center justify-center min-h-screen">
        <div style={{ color: INK }} className="text-sm tracking-wide">
          загрузка…
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <SetupScreen
        draft={draft}
        setDraft={setDraft}
        history={history}
        tab={tab}
        setTab={setTab}
        startMatch={startMatch}
        shareRecord={shareRecord}
        deleteHistoryRecord={deleteHistoryRecord}
      />
    );
  }

  const cfg = FORMATS[match.format];
  const team1Name = match.team1Name || "Команда 1";
  const team2Name = match.team2Name || "Команда 2";
  const team1Players = match.team1Players || [];
  const team2Players = match.team2Players || [];
  const rawTeamPlayers = selTeam === "team1" ? team1Players : selTeam === "team2" ? team2Players : [];
  const teamPlayers = rawTeamPlayers.filter((p) => ballsUsed(p) < cfg.balls);

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

        {tab === "log" && (
          <LogScreen
            match={match}
            geimState={geimState}
            updateGeim={updateGeim}
            throws={throws}
            teamPlayers={teamPlayers}
            team1Name={team1Name}
            team2Name={team2Name}
            selTeam={selTeam}
            setSelTeam={setSelTeam}
            selPlayer={selPlayer}
            setSelPlayer={setSelPlayer}
            selType={selType}
            setSelType={setSelType}
            logThrow={logThrow}
            undoLast={undoLast}
            deleteThrow={deleteThrow}
            endGeimOpen={endGeimOpen}
            openEndGeim={openEndGeim}
            setEndGeimOpen={setEndGeimOpen}
            endGeimScores={endGeimScores}
            setEndGeimScores={setEndGeimScores}
            confirmEndGeim={confirmEndGeim}
            setConfirmEndMatch={setConfirmEndMatch}
          />
        )}

        {tab === "stats" && <StatsPanel match={match} throws={throws} gameScores={gameScores} />}

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
