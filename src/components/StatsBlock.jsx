import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CARD, DIST_ZONES } from "../constants";
import { pct, calcPlayerStats, sumStats, calcDistanceZones } from "../utils/stats";
import { useLang } from "../i18n/LangContext";
import PlayerCard from "./PlayerCard";
import ThrowGrid from "./ThrowGrid";

export default function StatsBlock({ title, players, throws, gameScores, teamTag, accent }) {
  const { t } = useLang();
  const [gridMode, setGridMode] = useState(null); // null | 'team' | <playerName>
  const teamRows = players.map((p) => ({ name: p, s: calcPlayerStats(throws, p) }));
  const total = sumStats(teamRows.map((r) => r.s));
  const zones = calcDistanceZones(throws, teamTag);
  const teamThrows = throws.filter((tw) => tw.team === teamTag);

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
        <PlayerCard name={t("total")} s={total} bold accent={accent} />
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
            {gridMode === r.name && <ThrowGrid throws={throws.filter((tw) => tw.player === r.name)} allThrows={throws} gameScores={gameScores} />}
          </React.Fragment>
        ))}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 opacity-60">{t("by_distance")}</div>
      <div className="grid grid-cols-3 gap-2">
        {DIST_ZONES.map((z) => {
          const pt = zones.point[z.key];
          const tr = zones.tir[z.key];
          return (
            <div key={z.key} className="rounded-lg p-2 text-center" style={{ backgroundColor: CARD }}>
              <div className="text-[10px] font-bold uppercase">{t(z.labelKey)}</div>
              <div className="text-[9px] opacity-50 mb-1">{t(z.hintKey)}</div>
              <div className="text-[10px]">
                {t("letter_point")}: <span className="font-black">{pct(pt.success, pt.total)}</span>
              </div>
              <div className="text-[10px]">
                {t("letter_tir")}: <span className="font-black">{pct(tr.success, tr.total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
