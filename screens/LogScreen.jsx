import { RotateCcw, X } from "lucide-react";
import { FORMATS, PINE, PINE_DARK, BRONZE, GOOD, BAD, YELLOW, CARD, BORDER, INK } from "../constants";
import { useLang } from "../i18n/LangContext";

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
  selTirAuBut,
  setSelTirAuBut,
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
  const { t } = useLang();
  const cfg = FORMATS[match.format];
  const teamColor = selTeam === "team2" ? BRONZE : PINE;

  return (
    <>
      <div className="rounded-lg border-2 p-3 mb-3 bg-white" style={{ borderColor: BORDER }}>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <div className="text-[10px] uppercase tracking-wide opacity-60">{t("geim")}</div>
            <div className="text-xl font-black">{geimState.geim}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide opacity-60">{t("score")}</div>
            <div className="text-xl font-black">
              {geimState.team1Score}:{geimState.team2Score}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide opacity-60">{t("distance")}</div>
            <input
              value={geimState.distance}
              onChange={(e) => updateGeim({ distance: e.target.value })}
              placeholder={t("unit_m")}
              className="w-full mt-0.5 px-1.5 py-1 rounded border text-sm font-bold text-center"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>
        <div className="text-[10px] opacity-50 mt-1.5">{t("distance_hint")}</div>
      </div>

      {!endGeimOpen ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={openEndGeim} className="py-2.5 rounded-md font-bold text-white text-sm" style={{ backgroundColor: PINE }}>
            {t("end_geim_btn")}
          </button>
          <button onClick={() => setConfirmEndMatch(true)} className="py-2.5 rounded-md font-bold text-sm border-2" style={{ borderColor: BAD, color: BAD }}>
            {t("end_match_btn")}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border-2 p-3 mb-4" style={{ borderColor: PINE, backgroundColor: "#dfe6df" }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-2">{t("score_after_geim")}</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide opacity-60 truncate">{team1Name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  onClick={() => setEndGeimScores({ ...endGeimScores, team1: Math.max(0, (parseInt(endGeimScores.team1) || 0) - 1) })}
                  className="w-8 h-8 shrink-0 rounded-md border-2 font-bold"
                  style={{ borderColor: BORDER }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={endGeimScores.team1}
                  onChange={(e) => setEndGeimScores({ ...endGeimScores, team1: e.target.value })}
                  className="w-full px-2 py-1.5 rounded border text-lg font-black text-center"
                  style={{ borderColor: BORDER }}
                />
                <button
                  onClick={() => setEndGeimScores({ ...endGeimScores, team1: (parseInt(endGeimScores.team1) || 0) + 1 })}
                  className="w-8 h-8 shrink-0 rounded-md font-bold text-white"
                  style={{ backgroundColor: PINE }}
                >
                  +1
                </button>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide opacity-60 truncate">{team2Name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  onClick={() => setEndGeimScores({ ...endGeimScores, team2: Math.max(0, (parseInt(endGeimScores.team2) || 0) - 1) })}
                  className="w-8 h-8 shrink-0 rounded-md border-2 font-bold"
                  style={{ borderColor: BORDER }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={endGeimScores.team2}
                  onChange={(e) => setEndGeimScores({ ...endGeimScores, team2: e.target.value })}
                  className="w-full px-2 py-1.5 rounded border text-lg font-black text-center"
                  style={{ borderColor: BORDER }}
                />
                <button
                  onClick={() => setEndGeimScores({ ...endGeimScores, team2: (parseInt(endGeimScores.team2) || 0) + 1 })}
                  className="w-8 h-8 shrink-0 rounded-md font-bold text-white"
                  style={{ backgroundColor: BRONZE }}
                >
                  +1
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={confirmEndGeim} className="flex-1 py-2 rounded-md font-bold text-white text-sm" style={{ backgroundColor: PINE }}>
              {t("confirm")}
            </button>
            <button onClick={() => setEndGeimOpen(false)} className="px-3 py-2 rounded-md font-bold text-sm border-2" style={{ borderColor: BORDER }}>
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">{t("team")}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSelTeam("team1");
              setSelPlayer(null);
              setSelType(null);
              setSelTirAuBut(false);
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
              setSelTirAuBut(false);
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
          <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">{t("player")}</div>
          {teamPlayers.length === 0 ? (
            <div className="text-xs italic opacity-50 px-1">{t("all_balls_used")}</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {teamPlayers.map((p) => {
                const used = throws.filter((tw) => tw.player === p && tw.geim === geimState.geim).length;
                const remaining = cfg.balls - used;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setSelPlayer(p);
                      setSelType(null);
                      setSelTirAuBut(false);
                    }}
                    className="py-2.5 px-3 rounded-md font-semibold text-sm border-2 flex items-center justify-between gap-2"
                    style={{
                      borderColor: selPlayer === p ? PINE_DARK : BORDER,
                      backgroundColor: selPlayer === p ? "#dfe6df" : "white",
                      color: INK,
                    }}
                  >
                    <span className="truncate text-left">{p}</span>
                    <span className="flex gap-1 shrink-0">
                      {Array.from({ length: cfg.balls }).map((_, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: i < remaining ? teamColor : "transparent",
                            border: `1.5px solid ${teamColor}`,
                          }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selPlayer && (
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">{t("throw_type")}</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setSelType("point");
                setSelTirAuBut(false);
              }}
              className="py-2.5 rounded-md font-bold text-sm border-2"
              style={{
                borderColor: selType === "point" ? PINE : BORDER,
                backgroundColor: selType === "point" ? PINE : "white",
                color: selType === "point" ? "white" : INK,
              }}
            >
              {t("point")}
            </button>
            <button
              onClick={() => {
                setSelType("tir");
                setSelTirAuBut(false);
              }}
              className="py-2.5 rounded-md font-bold text-sm border-2"
              style={{
                borderColor: selType === "tir" ? PINE : BORDER,
                backgroundColor: selType === "tir" ? PINE : "white",
                color: selType === "tir" ? "white" : INK,
              }}
            >
              {t("tir")}
            </button>
          </div>
        </div>
      )}

      {selType === "point" && (
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">{t("result")}</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => logThrow("success")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: GOOD }}>
              {t("success")}
            </button>
            <button onClick={() => logThrow("fail")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: BAD }}>
              {t("fail")}
            </button>
          </div>
        </div>
      )}

      {selType === "tir" && (
        <div className="mb-4">
          <button
            onClick={() => setSelTirAuBut(!selTirAuBut)}
            className="w-full py-3 px-3 rounded-md font-bold text-sm border-2 mb-2"
            style={{
              borderColor: selTirAuBut ? PINE : BORDER,
              backgroundColor: selTirAuBut ? PINE : "white",
              color: selTirAuBut ? "white" : INK,
            }}
          >
            {t("tir_au_but_btn")}
          </button>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1.5 opacity-70">{t("result")}</div>
          <div className={`grid gap-2 ${selTirAuBut ? "grid-cols-2" : "grid-cols-3"}`}>
            <button onClick={() => logThrow("miss")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: BAD }}>
              {t("miss")}
            </button>
            <button onClick={() => logThrow("hit")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: GOOD }}>
              {t("hit")}
            </button>
            {!selTirAuBut && (
              <button onClick={() => logThrow("carreau")} className="py-4 rounded-md font-bold text-white text-sm" style={{ backgroundColor: YELLOW }}>
                {t("carreau")}
              </button>
            )}
          </div>
        </div>
      )}

      {throws.length > 0 && (
        <div className="mt-4 rounded-lg border-2 p-3 bg-white" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase opacity-70">{t("throws_current")}</div>
            <button onClick={undoLast} className="flex items-center gap-1 text-xs font-semibold opacity-70">
              <RotateCcw size={13} /> {t("undo_last")}
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {throws
              .slice()
              .reverse()
              .map((tw) => (
                <div key={tw.id} className="flex items-center justify-between text-xs p-1.5 rounded" style={{ backgroundColor: CARD }}>
                  <div className="truncate mr-2">
                    <span className="font-bold">{tw.player}</span> ({tw.team === "team1" ? team1Name : team2Name}): {tw.type === "point" ? t("point").toLowerCase() : t("tir").toLowerCase()} —{" "}
                    <span
                      className="font-bold"
                      style={{
                        color: tw.result === "carreau" ? YELLOW : tw.result === "success" || tw.result === "hit" ? GOOD : BAD,
                      }}
                    >
                      {tw.result === "success" || tw.result === "hit" ? t("success").toLowerCase() : tw.result === "carreau" ? t("carreau").toLowerCase() : t("fail").toLowerCase()}
                    </span>
                    {tw.tirAuBut ? t("by_jack_suffix") : ""}
                    {tw.distance ? ` [${tw.distance}${t("unit_m")}]` : ""}
                  </div>
                  <button onClick={() => deleteThrow(tw.id)} className="opacity-40 p-0.5">
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
