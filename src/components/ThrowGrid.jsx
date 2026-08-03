import { GOOD, BAD, YELLOW, CARD, BORDER } from "../constants";
import { startScoreFor } from "../utils/stats";
import { useLang } from "../i18n/LangContext";

// Сетка бросков: колонка = один бросок в хронологическом порядке.
// Пойнт и тир — в отдельных строках; пустая ячейка помечена буквой своей строки.
// Если гейм закончили раньше, чем разыграли все шары (например, набрали нужный счёт
// не полным составом), достраиваем пустые пунктирные клетки на несыгранные шары —
// игрок вышел в гейм, но не успел сыграть его до конца.
export default function ThrowGrid({ throws, allThrows, gameScores, expectedBalls }) {
  const { t } = useLang();
  const scoreGeims = (gameScores || []).map((s) => s.geim);
  const finishedGeims = new Set(scoreGeims);
  const throwGeims = allThrows.map((tw) => tw.geim);
  const geims = [...new Set([...throwGeims, ...scoreGeims])].sort((a, b) => a - b);

  if (geims.length === 0) {
    return <div className="text-xs italic opacity-50 px-2 py-3">{t("no_throws")}</div>;
  }

  const cellColor = (tw) => {
    if (!tw) return null;
    if (tw.type === "point") return tw.result === "success" ? GOOD : BAD;
    if (tw.result === "carreau") return YELLOW;
    return tw.result === "hit" ? GOOD : BAD;
  };

  return (
    <div className="mb-3 rounded-lg p-2 overflow-x-auto" style={{ backgroundColor: CARD }}>
      <div className="inline-flex gap-3">
        {geims.map((g) => {
          let geimThrows = throws.filter((tw) => tw.geim === g);
          if (finishedGeims.has(g) && expectedBalls && geimThrows.length < expectedBalls) {
            geimThrows = [...geimThrows, ...Array(expectedBalls - geimThrows.length).fill(null)];
          }
          const firstOfGeim = allThrows.find((tw) => tw.geim === g);
          const dist = firstOfGeim && firstOfGeim.distance ? `${firstOfGeim.distance}${t("unit_m")}` : "—";
          const score = startScoreFor(g, gameScores);
          return (
            <div key={g} className="flex flex-col items-center shrink-0">
              <div className="text-[9px] font-bold text-center leading-tight mb-1 whitespace-nowrap">
                {g}. {score.team1}:{score.team2} {dist}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {geimThrows.map((tw, i) => {
                    if (!tw)
                      return (
                        <div key={i} className="w-4 h-4 rounded-sm" style={{ border: `1px dashed ${BORDER}`, opacity: 0.5 }} />
                      );
                    const c = tw.type === "point" ? cellColor(tw) : null;
                    return (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm flex items-center justify-center"
                        style={{ backgroundColor: c || "transparent", border: c ? "none" : `1px solid ${BORDER}` }}
                      >
                        {!c && <span className="text-[8px] font-bold opacity-40">{t("letter_point")}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {geimThrows.map((tw, i) => {
                    if (!tw)
                      return (
                        <div key={i} className="w-4 h-4 rounded-sm" style={{ border: `1px dashed ${BORDER}`, opacity: 0.5 }} />
                      );
                    const c = tw.type === "tir" ? cellColor(tw) : null;
                    return (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm flex items-center justify-center relative"
                        style={{ backgroundColor: c || "transparent", border: c ? "none" : `1px solid ${BORDER}` }}
                      >
                        {!c && <span className="text-[8px] font-bold opacity-40">{t("letter_tir")}</span>}
                        {c && tw.tirAuBut && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
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
