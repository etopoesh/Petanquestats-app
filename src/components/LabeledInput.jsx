import { BORDER } from "../constants";

export default function LabeledInput({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</label>
      <input {...props} className="w-full mt-1 px-2 py-2 rounded-md border-2 bg-white text-sm" style={{ borderColor: BORDER }} />
    </div>
  );
}
