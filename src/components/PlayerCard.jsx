import { ChevronDown, ChevronUp } from "lucide-react";
import { pct } from "../utils/stats";
import StatCell from "./StatCell";

export default function PlayerCard({ name, s, bold, accent, clickable, active, onClick }) {
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
        {s.tirAuButTotal > 0 && (
          <div className="col-span-2">
            <StatCell label="Тир о бю" value={`${s.tirAuButSuccess}/${s.tirAuButTotal}`} pctVal={pct(s.tirAuButSuccess, s.tirAuButTotal)} />
          </div>
        )}
      </div>
    </div>
  );
}
