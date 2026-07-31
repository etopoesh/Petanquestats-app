import { FORMATS, PINE, BRONZE } from "../constants";
import StatsBlock from "./StatsBlock";

export default function StatsPanel({ match, throws, gameScores }) {
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
