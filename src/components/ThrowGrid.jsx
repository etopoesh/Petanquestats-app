import { GOOD, BAD, YELLOW, CARD, BORDER } from "../constants";
import { startScoreFor } from "../utils/stats";

// Сетка бросков: колонка = один бросок в хронологическом порядке.
// Пойнт и тир — в отдельных строках; пустая ячейка помечена буквой своей строки.
export default function ThrowGrid({ throws, allThrows, gameScores }) {
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

  return (
    <div className="mb-3 rounded-lg p-2 overflow-x-auto" style={{ backgroundColor: CARD }}>
      <div className="inline-flex gap-3">
        {geims.map((g) => {
          const geimThrows = throws.filter((t) => t.geim === g);
          const firstOfGeim = allThrows.find((t) => t.geim === g);
          const dist = firstOfGeim && firstOfGeim.distance ? `${firstOfGeim.distance}м` : "—";
          const score = startScoreFor(g, gameScores);
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
                        className="w-4 h-4 rounded-sm flex items-center justify-center relative"
                        style={{ backgroundColor: c || "transparent", border: c ? "none" : `1px solid ${BORDER}` }}
                      >
                        {!c && <span className="text-[8px] font-bold opacity-40">т</span>}
                        {c && t.tirAuBut && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
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
