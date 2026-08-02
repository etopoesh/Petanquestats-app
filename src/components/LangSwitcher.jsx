import { LANGS, LANG_LABELS } from "../i18n/dictionary";
import { useLang } from "../i18n/LangContext";
import { BORDER, PINE, INK } from "../constants";

export default function LangSwitcher({ compact }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-md border-2 overflow-hidden ${compact ? "text-[10px]" : "text-xs"}`} style={{ borderColor: BORDER }}>
      {LANGS.map((l, i) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 font-bold ${compact ? "py-1" : "py-1.5"}`}
          style={{
            backgroundColor: lang === l ? PINE : "white",
            color: lang === l ? "white" : INK,
            borderLeft: i === 0 ? "none" : `2px solid ${BORDER}`,
          }}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
