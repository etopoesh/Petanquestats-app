import { CARD } from "../constants";

export default function StatCell({ label, value, pctVal }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded" style={{ backgroundColor: CARD }}>
      <div>
        <div className="text-[10px] uppercase tracking-wide opacity-60">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
      <div className="text-base font-black">{pctVal}</div>
    </div>
  );
}
