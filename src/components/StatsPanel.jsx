import { FORMATS, PINE, BRONZE } from "../constants";
import { useLang } from "../i18n/LangContext";
import StatsBlock from "./StatsBlock";

export default function StatsPanel({ match, throws, gameScores }) {
  const { t } = useLang();
  const team1Name = match.team1Name || t("default_team1");
  const team2Name = match.team2Name || t("default_team2");
  const team1Players = match.team1Players || [];
  const team2Players = match.team2Players || [];
  const safeThrows = throws || [];
  const safeScores = gameScores || [];
  return (
    <div>
      <h2 className="text-xl font-black mb-1">{t("overview")}</h2>
      <div className="text-xs opacity-60 mb-4">{FORMATS[match.format] ? t(FORMATS[match.format].labelKey) : ""}</div>
      <StatsBlock title={team1Name} players={team1Players} throws={safeThrows} gameScores={safeScores} teamTag="team1" accent={PINE} />
      <StatsBlock title={team2Name} players={team2Players} throws={safeThrows} gameScores={safeScores} teamTag="team2" accent={BRONZE} />
    </div>
  );
}
