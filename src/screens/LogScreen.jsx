import { RotateCcw, X } from "lucide-react";
import { PINE, PINE_DARK, BRONZE, GOOD, BAD, YELLOW, CARD, BORDER, INK } from "../constants";

export default function LogScreen({
  match,
  geimState,
  updateGeim,
  throws,
  teamPlayers,
  team1Name,
  team2Name,
  selTeam,
  setSelTeam,
  selPlayer,
  setSelPlayer,
  selType,
  setSelType,
  logThrow,
  undoLast,
  deleteThrow,
  endGeimOpen,
  openEndGeim,
  setEndGeimOpen,
  endGeimScores,
  setEndGeimScores,
  confirmEndGeim,
  setConfirmEndMatch,
}) {
  return (
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
                        color: t.result === "carreau" ? YELLOW : t.result === "success" || t.result === "hit" ? GOOD : BAD,
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
  );
}
