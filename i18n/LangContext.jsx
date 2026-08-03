import { createContext, useContext, useState, useEffect } from "react";
import { translations, translate, LANG_KEY, DEFAULT_LANG } from "./dictionary";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && translations[saved]) setLangState(saved);
    } catch (e) {
      // недоступно — остаёмся на языке по умолчанию
    }
  }, []);

  const setLang = (l) => {
    if (!translations[l]) return;
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch (e) {
      // недоступно — просто не сохранится между запусками
    }
  };

  const t = (key, vars) => translate(lang, key, vars);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang() must be used inside <LangProvider>");
  return ctx;
}
