import React, { useState, useEffect } from "react";

const FORMATS = {
  triplet: { label: "Триплет", count: 3, bowlsPerPlayer: 2 },
  doublet: { label: "Дуплет", count: 2, bowlsPerPlayer: 3 },
  tetaTet: { label: "Тет-а-тет", count: 1, bowlsPerPlayer: 3 },
};

export default function PetanqueTracker() {
  const [activeTab, setActiveTab] = useState("setup"); // 'setup' | 'game' | 'stats' | 'history'

  // Настройки партии (Игровые данные)
  const [setupData, setSetupData] = useState({
    date: new Date().toISOString().split("T")[0],
    event: "",
    team1: "Команда 1",
    team2: "Команда 2",
    format: "doublet",
  });

  // Состояние активной партии
  const [partyState, setPartyState] = useState({
    geym: 1,
    team1Score: 0,
    team2Score: 0,
    distance: 6.0,
    activeTeam: "team1",
  });

  const [throws, setThrows] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedHistoryParty, setSelectedHistoryParty] = useState(null);
  const [showEndGeymModal, setShowEndGeymModal] = useState(false);
  const [geymPoints, setGeymPoints] = useState({ team1: 0, team2: 0 });
  const [copied, setCopied] = useState(false);

  // Загрузка сохраненных данных из localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("petanque_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Ошибка загрузки истории", e);
      }
    }
  }, []);

  const saveHistoryToStorage = (updatedHistory) => {
    setHistory(updatedHistory);
    localStorage.setItem("petanque_history", JSON.stringify(updatedHistory));
  };

  // Смена формата без сброса полей события, даты и команд
  const handleFormatChange = (key) => {
    setSetupData((prev) => ({
      ...prev,
      format: key,
    }));
  };

  // Фиксация броска (Пойнт, Тир, Каро)
  const addThrow = (type, result) => {
    const newThrow = {
      id: Date.now(),
      geym: partyState.geym,
      team: partyState.activeTeam,
      teamName: partyState.activeTeam === "team1" ? (setupData.team1 || "Команда 1") : (setupData.team2 || "Команда 2"),
      type, // 'point' | 'tir'
      result, // 'success' | 'miss' | 'carreau'
      distance: parseFloat(partyState.distance) || 6.0,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setThrows((prev) => [...prev, newThrow]);
  };

  const undoLastThrow = () => {
    setThrows((prev) => prev.slice(0, -1));
  };

  // Завершение и сохранение партии
  const finishParty = (finalScore1 = partyState.team1Score, finalScore2 = partyState.team2Score) => {
    const completedParty = {
      id: Date.now(),
      date: setupData.date,
      event: setupData.event || "Товарищеская партия",
      format: FORMATS[setupData.format]?.label || "Дуплет",
      team1: setupData.team1 || "Команда 1",
      team2: setupData.team2 || "Команда 2",
      score1: finalScore1,
      score2: finalScore2,
      throws: [...throws],
    };

    const newHistory = [completedParty, ...history];
    saveHistoryToStorage(newHistory);
    alert("Партия успешно сохранена в Историю!");
    setActiveTab("history");
  };

  // Завершение гейма и запись счета
  const handleFinishGeym = () => {
    const add1 = Number(geymPoints.team1) || 0;
    const add2 = Number(geymPoints.team2) || 0;
    const newScore1 = partyState.team1Score + add1;
    const newScore2 = partyState.team2Score + add2;

    setPartyState((prev) => ({
      ...prev,
      team1Score: newScore1,
      team2Score: newScore2,
      geym: prev.geym + 1,
    }));

    setShowEndGeymModal(false);
    setGeymPoints({ team1: 0, team2: 0 });

    if (newScore1 >= 13 || newScore2 >= 13) {
      if (window.confirm("Одна из команд набрала 13 очков. Завершить партию?")) {
        finishParty(newScore1, newScore2);
      }
    }
  };

  // Расчет подробной статистики (включая КАРО)
  const calculateStats = (targetThrows = throws) => {
    const points = targetThrows.filter((t) => t.type === "point");
    const tirs = targetThrows.filter((t) => t.type === "tir");

    const pointSuccess = points.filter((t) => t.result === "success").length;
    const tirHits = tirs.filter((t) => t.result === "success" || t.result === "carreau").length;
    const carreauHits = tirs.filter((t) => t.result === "carreau").length;

    const calcGroup = (pList, tList) => {
      const pTotal = pList.length;
      const pSucc = pList.filter((t) => t.result === "success").length;
      const pPct = pTotal > 0 ? Math.round((pSucc / pTotal) * 100) : 0;

      const tTotal = tList.length;
      const tHits = tList.filter((t) => t.result === "success" || t.result === "carreau").length;
      const tPct = tTotal > 0 ? Math.round((tHits / tTotal) * 100) : 0;

      const cHits = tList.filter((t) => t.result === "carreau").length;

      return { pTotal, pSucc, pPct, tTotal, tHits, tPct, cHits };
    };

    // Группировка по дистанциям
    const d1 = targetThrows.filter((t) => t.distance >= 6.0 && t.distance <= 7.5);
    const d2 = targetThrows.filter((t) => t.distance > 7.5 && t.distance <= 8.5);
    const d3 = targetThrows.filter((t) => t.distance > 8.5 && t.distance <= 10.0);

    return {
      totalThrows: targetThrows.length,
      point: {
        total: points.length,
        success: pointSuccess,
        percent: points.length > 0 ? Math.round((pointSuccess / points.length) * 100) : 0,
      },
      tir: {
        total: tirs.length,
        hits: tirHits,
        percent: tirs.length > 0 ? Math.round((tirHits / tirs.length) * 100) : 0,
      },
      carreau: {
        count: carreauHits,
        percent: tirs.length > 0 ? Math.round((carreauHits / tirs.length) * 100) : 0,
      },
      byDistance: {
        range1: {
          label: "6.0 – 7.5 м",
          stats: calcGroup(
            d1.filter((t) => t.type === "point"),
            d1.filter((t) => t.type === "tir")
          ),
        },
        range2: {
          label: "7.5 – 8.5 м",
          stats: calcGroup(
            d2.filter((t) => t.type === "point"),
            d2.filter((t) => t.type === "tir")
          ),
        },
        range3: {
          label: "8.5 – 10.0 м",
          stats: calcGroup(
            d3.filter((t) => t.type === "point"),
            d3.filter((t) => t.type === "tir")
          ),
        },
      },
    };
  };

  const currentStats = calculateStats(throws);

  // Формирование сообщения для отправки в мессенджеры
  const copyStatsToClipboard = (partyInfo, targetThrows) => {
    const st = calculateStats(targetThrows);
    const formatLabel = partyInfo.format || FORMATS[setupData.format]?.label || "Формат";
    const text = `
🏆 *${partyInfo.event || "Петанк партия"}* (${formatLabel})
📅 *Дата:* ${partyInfo.date || setupData.date}
⚔️ *Счёт:* ${partyInfo.team1 || setupData.team1} [${partyInfo.score1 ?? partyState.team1Score} : ${partyInfo.score2 ?? partyState.team2Score}] ${partyInfo.team2 || setupData.team2}

📊 *Обзор статистики:*
• Всего бросков: ${st.totalThrows}
• Пойнт: ${st.point.percent}% (${st.point.success}/${st.point.total})
• Тир: ${st.tir.percent}% (${st.tir.hits}/${st.tir.total})
• Каро (Carreau): ${st.carreau.percent}% (${st.carreau.count} шт.)

📏 *По дистанциям (Пойнт % / Тир % / Каро шт):*
• 6.0–7.5м: P ${st.byDistance.range1.stats.pPct}% | T ${st.byDistance.range1.stats.tPct}% | C ${st.byDistance.range1.stats.cHits}
• 7.5–8.5м: P ${st.byDistance.range2.stats.pPct}% | T ${st.byDistance.range2.stats.tPct}% | C ${st.byDistance.range2.stats.cHits}
• 8.5–10.0м: P ${st.byDistance.range3.stats.pPct}% | T ${st.byDistance.range3.stats.tPct}% | C ${st.byDistance.range3.stats.cHits}
    `.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopyText(text));
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать", err);
    }
    document.body.removeChild(textarea);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C221E] font-sans flex flex-col justify-between max-w-md mx-auto p-4 border-x border-[#E6DCCF]">
      <div>
        {/* Навигация по вкладкам */}
        <nav className="flex bg-[#F5EFE6] p-1 rounded-xl mb-4 border border-[#E6DCCF] text-xs font-semibold">
          <button
            onClick={() => setActiveTab("setup")}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              activeTab === "setup" ? "bg-[#6E473B] text-white shadow-sm" : "text-[#6E5D4F]"
            }`}
          >
            Игровые данные
          </button>
          <button
            onClick={() => setActiveTab("game")}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              activeTab === "game" ? "bg-[#6E473B] text-white shadow-sm" : "text-[#6E5D4F]"
            }`}
          >
            Партия
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              activeTab === "stats" ? "bg-[#6E473B] text-white shadow-sm" : "text-[#6E5D4F]"
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              activeTab === "history" ? "bg-[#6E473B] text-white shadow-sm" : "text-[#6E5D4F]"
            }`}
          >
            История
          </button>
        </nav>

        {/* 1. ИГРОВЫЕ ДАННЫЕ (НАСТРОЙКА) */}
        {activeTab === "setup" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-[#E6DCCF] shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-[#4A3228] border-b pb-2 border-[#E6DCCF]">
                Параметры партии
              </h2>

              <div>
                <label className="block text-xs font-medium text-[#6E5D4F]">Событие</label>
                <input
                  type="text"
                  value={setupData.event}
                  onChange={(e) => setSetupData({ ...setupData, event: e.target.value })}
                  placeholder="Кубок города"
                  className="w-full text-sm mt-1 p-2 border border-[#D9C8B4] rounded-lg focus:outline-none focus:border-[#6E473B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E5D4F]">Дата</label>
                <input
                  type="date"
                  value={setupData.date}
                  onChange={(e) => setSetupData({ ...setupData, date: e.target.value })}
                  className="w-full text-sm mt-1 p-2 border border-[#D9C8B4] rounded-lg focus:outline-none focus:border-[#6E473B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[#6E5D4F]">Команда 1</label>
                  <input
                    type="text"
                    value={setupData.team1}
                    onChange={(e) => setSetupData({ ...setupData, team1: e.target.value })}
                    className="w-full text-sm mt-1 p-2 border border-[#D9C8B4] rounded-lg focus:outline-none focus:border-[#6E473B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6E5D4F]">Команда 2</label>
                  <input
                    type="text"
                    value={setupData.team2}
                    onChange={(e) => setSetupData({ ...setupData, team2: e.target.value })}
                    className="w-full text-sm mt-1 p-2 border border-[#D9C8B4] rounded-lg focus:outline-none focus:border-[#6E473B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E5D4F] mb-1">
                  Формат партии
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(FORMATS).map(([key, f]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleFormatChange(key)}
                      className={`py-2 text-xs font-medium rounded-lg transition-all ${
                        setupData.format === key
                          ? "bg-[#6E473B] text-white shadow-sm"
                          : "bg-[#F5EFE6] text-[#524338] border border-[#D9C8B4]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("game")}
              className="w-full py-3 bg-[#3B5E49] hover:bg-[#2D4838] text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              Перейти к партии ➔
            </button>
          </div>
        )}

        {/* 2. НАЧАТАЯ ПАРТИЯ */}
        {activeTab === "game" && (
          <div className="space-y-4">
            {/* Табло партии */}
            <div className="bg-[#4A3228] text-[#FDFBF7] p-4 rounded-xl shadow-md text-center space-y-1">
              <div className="text-xs uppercase tracking-widest text-[#D9C8B4]">
                {FORMATS[setupData.format]?.label || "Партия"} • {setupData.event || "Товарищеская"}
              </div>
              <div className="flex justify-between items-center pt-2 px-2">
                <div className="text-left flex-1">
                  <div className="text-xs text-[#C4B2A3] truncate">{setupData.team1}</div>
                  <div className="text-3xl font-black">{partyState.team1Score}</div>
                </div>
                <div className="px-3 border-x border-[#6E5D4F]">
                  <div className="text-[10px] text-[#D9C8B4]">ГЕЙМ</div>
                  <div className="text-xl font-bold">{partyState.geym}</div>
                </div>
                <div className="text-right flex-1">
                  <div className="text-xs text-[#C4B2A3] truncate">{setupData.team2}</div>
                  <div className="text-3xl font-black">{partyState.team2Score}</div>
                </div>
              </div>
            </div>

            {/* Изменение дистанции */}
            <div className="bg-white p-3 rounded-xl border border-[#E6DCCF] flex justify-between items-center">
              <div>
                <label className="block text-xs font-semibold text-[#6E5D4F]">
                  Дистанция до кошонета (м)
                </label>
                <span className="text-[10px] text-gray-400">
                  (измените, если кошонет сдвинут)
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="6"
                max="10"
                value={partyState.distance}
                onChange={(e) => setPartyState({ ...partyState, distance: e.target.value })}
                className="w-20 text-center font-bold text-sm p-1.5 border border-[#D9C8B4] rounded-lg focus:outline-none focus:border-[#6E473B]"
              />
            </div>

            {/* Выбор активной команды */}
            <div>
              <label className="block text-xs font-semibold text-[#6E5D4F] mb-1">
                Бросает команда
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPartyState({ ...partyState, activeTeam: "team1" })}
                  className={`py-2 px-2 text-xs font-bold rounded-lg truncate transition-all ${
                    partyState.activeTeam === "team1"
                      ? "bg-[#6E473B] text-white shadow-sm"
                      : "bg-white text-[#524338] border border-[#D9C8B4]"
                  }`}
                >
                  {setupData.team1}
                </button>
                <button
                  onClick={() => setPartyState({ ...partyState, activeTeam: "team2" })}
                  className={`py-2 px-2 text-xs font-bold rounded-lg truncate transition-all ${
                    partyState.activeTeam === "team2"
                      ? "bg-[#6E473B] text-white shadow-sm"
                      : "bg-white text-[#524338] border border-[#D9C8B4]"
                  }`}
                >
                  {setupData.team2}
                </button>
              </div>
            </div>

            {/* Кнопки ввода бросков */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addThrow("point", "success")}
                className="p-2.5 bg-[#E3EFE0] hover:bg-[#D2E4CE] text-[#2D5027] font-semibold text-xs rounded-xl border border-[#B3D3AA] text-center"
              >
                🎯 Успешный Пойнт
              </button>
              <button
                onClick={() => addThrow("point", "miss")}
                className="p-2.5 bg-[#FCE8E6] hover:bg-[#F9D4D1] text-[#7A2720] font-semibold text-xs rounded-xl border border-[#F1B5B0] text-center"
              >
                ❌ Промах Пойнт
              </button>
              <button
                onClick={() => addThrow("tir", "carreau")}
                className="col-span-2 p-2.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] font-bold text-xs rounded-xl border border-[#F59E0B] text-center shadow-sm"
              >
                💥 КАРО (Carreau)
              </button>
              <button
                onClick={() => addThrow("tir", "success")}
                className="p-2.5 bg-[#E3EFE0] hover:bg-[#D2E4CE] text-[#2D5027] font-semibold text-xs rounded-xl border border-[#B3D3AA] text-center"
              >
                🎯 Успешный Тир
              </button>
              <button
                onClick={() => addThrow("tir", "miss")}
                className="p-2.5 bg-[#FCE8E6] hover:bg-[#F9D4D1] text-[#7A2720] font-semibold text-xs rounded-xl border border-[#F1B5B0] text-center"
              >
                ❌ Промах Тир
              </button>
            </div>

            {/* Управление геймом и партией */}
            <div className="flex gap-2">
              <button
                onClick={undoLastThrow}
                disabled={throws.length === 0}
                className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 rounded-lg font-medium"
              >
                ↩️ Отмена
              </button>
              <button
                onClick={() => setShowEndGeymModal(true)}
                className="flex-1 py-2 text-xs bg-[#6E473B] hover:bg-[#58382E] text-white rounded-lg font-bold shadow-sm"
              >
                🏁 Конец гейма
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Завершить партию досрочно и сохранить данные?")) {
                    finishParty();
                  }
                }}
                className="px-3 py-2 text-xs bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold shadow-sm"
              >
                Конец партии
              </button>
            </div>

            {/* Последовательность бросков */}
            <div className="bg-white p-3 rounded-xl border border-[#E6DCCF]">
              <h3 className="text-xs font-bold text-[#6E5D4F] uppercase tracking-wider mb-2">
                Последовательность бросков ({throws.length})
              </h3>
              {throws.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Броски ещё не делались</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {throws
                    .slice()
                    .reverse()
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center text-xs py-1 px-2 bg-[#FDFBF7] rounded border border-[#EFE7DD]"
                      >
                        <span className="font-semibold text-[#4A3228] truncate max-w-[90px]">
                          {t.teamName}
                        </span>
                        <span className="text-gray-500 font-mono">
                          Гейм {t.geym} • {t.distance}m
                        </span>
                        <span
                          className={`font-bold ${
                            t.result === "carreau"
                              ? "text-amber-600"
                              : t.result === "success"
                              ? "text-green-700"
                              : "text-red-600"
                          }`}
                        >
                          {t.result === "carreau"
                            ? "💥 КАРО"
                            : `${t.type === "point" ? "Пойнт" : "Тир"} ${
                                t.result === "success" ? "✓" : "✗"
                              }`}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. ОБЗОР (СТАТИСТИКА ТЕКУЩЕЙ ПАРТИИ) */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#4A3228]">
                Обзор: {FORMATS[setupData.format]?.label || "Партия"}
              </h2>
              <button
                onClick={() => copyStatsToClipboard(setupData, throws)}
                className="px-3 py-1.5 text-xs bg-[#3B5E49] hover:bg-[#2D4838] text-white rounded-lg font-semibold shadow-sm transition-all"
              >
                {copied ? "✓ Скопировано" : "📋 В чат"}
              </button>
            </div>

            {/* Карточки с % Пойнта, Тира и Каро */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-[#E6DCCF] text-center">
                <div className="text-[11px] text-[#6E5D4F] font-semibold">Пойнт</div>
                <div className="text-xl font-black text-[#4A3228]">
                  {currentStats.point.percent}%
                </div>
                <div className="text-[9px] text-gray-500">
                  {currentStats.point.success}/{currentStats.point.total}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E6DCCF] text-center">
                <div className="text-[11px] text-[#6E5D4F] font-semibold">Тир</div>
                <div className="text-xl font-black text-[#4A3228]">
                  {currentStats.tir.percent}%
                </div>
                <div className="text-[9px] text-gray-500">
                  {currentStats.tir.hits}/{currentStats.tir.total}
                </div>
              </div>

              <div className="bg-[#FEF3C7] p-2.5 rounded-xl border border-[#F59E0B] text-center">
                <div className="text-[11px] text-[#92400E] font-bold">Каро</div>
                <div className="text-xl font-black text-[#92400E]">
                  {currentStats.carreau.percent}%
                </div>
                <div className="text-[9px] text-[#B45309]">
                  {currentStats.carreau.count} шт.
                </div>
              </div>
            </div>

            {/* Детализация по 3 диапазонам дистанции */}
            <div className="bg-white p-3 rounded-xl border border-[#E6DCCF] space-y-2.5">
              <h3 className="text-xs font-bold text-[#6E5D4F] uppercase tracking-wider">
                Статистика по дистанциям
              </h3>

              {Object.values(currentStats.byDistance).map((group, idx) => (
                <div key={idx} className="p-2 bg-[#FDFBF7] rounded-lg border border-[#EFE7DD]">
                  <div className="text-xs font-bold text-[#4A3228] mb-1">{group.label}</div>
                  <div className="grid grid-cols-3 text-[11px] text-[#524338]">
                    <div>
                      Пойнт: <b>{group.stats.pPct}%</b>
                    </div>
                    <div>
                      Тир: <b>{group.stats.tPct}%</b>
                    </div>
                    <div>
                      Каро: <b>{group.stats.cHits} шт</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ИСТОРИЯ ПАРТИЙ */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#4A3228]">История партий</h2>

            {history.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-[#E6DCCF] text-center text-xs text-gray-400">
                Завершённых партий пока нет.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistoryParty(item)}
                    className="bg-white p-3 rounded-xl border border-[#E6DCCF] shadow-sm hover:border-[#6E473B] cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{item.date}</span>
                      <span className="font-semibold text-[#6E473B]">{item.format}</span>
                    </div>
                    <div className="text-xs font-bold text-[#4A3228]">{item.event}</div>
                    <div className="flex justify-between items-center pt-1 text-xs font-black">
                      <span>{item.team1}</span>
                      <span className="bg-[#F5EFE6] px-2 py-0.5 rounded border border-[#E6DCCF]">
                        {item.score1} : {item.score2}
                      </span>
                      <span>{item.team2}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ПАРТИИ ИЗ ИСТОРИИ */}
      {selectedHistoryParty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b pb-2 border-[#E6DCCF]">
              <h3 className="font-bold text-xs text-[#4A3228]">Обзор партии</h3>
              <button
                onClick={() => setSelectedHistoryParty(null)}
                className="text-gray-400 hover:text-black font-bold text-sm px-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div>
                <b>Событие:</b> {selectedHistoryParty.event}
              </div>
              <div>
                <b>Дата:</b> {selectedHistoryParty.date}
              </div>
              <div>
                <b>Формат:</b> {selectedHistoryParty.format}
              </div>
              <div className="font-bold text-sm text-[#6E473B] pt-1">
                {selectedHistoryParty.team1} [{selectedHistoryParty.score1} :{" "}
                {selectedHistoryParty.score2}] {selectedHistoryParty.team2}
              </div>
            </div>

            {/* Процентная статистика прошедшей партии */}
            {(() => {
              const hStats = calculateStats(selectedHistoryParty.throws || []);
              return (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-2 bg-[#FDFBF7] rounded border border-[#E6DCCF]">
                      <div className="text-[10px] text-[#6E5D4F]">Пойнт</div>
                      <div className="text-base font-black text-[#4A3228]">{hStats.point.percent}%</div>
                    </div>
                    <div className="p-2 bg-[#FDFBF7] rounded border border-[#E6DCCF]">
                      <div className="text-[10px] text-[#6E5D4F]">Тир</div>
                      <div className="text-base font-black text-[#4A3228]">{hStats.tir.percent}%</div>
                    </div>
                    <div className="p-2 bg-[#FEF3C7] rounded border border-[#F59E0B]">
                      <div className="text-[10px] text-[#92400E]">Каро</div>
                      <div className="text-base font-black text-[#92400E]">
                        {hStats.carreau.percent}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#6E5D4F]">По дистанциям:</div>
                    {Object.values(hStats.byDistance).map((d, i) => (
                      <div key={i} className="text-[10px] p-1.5 bg-[#FDFBF7] rounded border border-[#EFE7DD]">
                        <b>{d.label}:</b> P {d.stats.pPct}% | T {d.stats.tPct}% | Каро:{" "}
                        {d.stats.cHits} шт
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => copyStatsToClipboard(selectedHistoryParty, selectedHistoryParty.throws)}
              className="w-full py-2 bg-[#3B5E49] hover:bg-[#2D4838] text-white text-xs font-bold rounded-lg shadow transition-all"
            >
              {copied ? "✓ Скопировано" : "Скопировать статистику в чат"}
            </button>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО КОНЦА ГЕЙМА */}
      {showEndGeymModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 w-full max-w-xs space-y-4 shadow-xl">
            <h3 className="font-bold text-xs text-[#4A3228] text-center border-b pb-2 border-[#E6DCCF]">
              Результат гейма №{partyState.geym}
            </h3>

            <div className="space-y-2">
              <div>
                <label className="block text-xs text-[#6E5D4F] mb-1">{setupData.team1}</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={geymPoints.team1}
                  onChange={(e) => setGeymPoints({ ...geymPoints, team1: e.target.value })}
                  className="w-full p-2 border border-[#D9C8B4] rounded-lg text-sm text-center font-bold focus:outline-none focus:border-[#6E473B]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6E5D4F] mb-1">{setupData.team2}</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={geymPoints.team2}
                  onChange={(e) => setGeymPoints({ ...geymPoints, team2: e.target.value })}
                  className="w-full p-2 border border-[#D9C8B4] rounded-lg text-sm text-center font-bold focus:outline-none focus:border-[#6E473B]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEndGeymModal(false)}
                className="flex-1 py-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={handleFinishGeym}
                className="flex-1 py-2 text-xs bg-[#6E473B] hover:bg-[#58382E] text-white rounded-lg font-bold"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ПОДПИСЬ РАЗРАБОТЧИКА ВНИЗУ КАЖДОЙ СТРАНИЦЫ */}
      <footer className="mt-4 pt-3 border-t border-[#E6DCCF] text-center">
        <p className="text-[11px] italic text-[#8C7A6B] font-serif">Équipe Radius</p>
      </footer>
    </div>
  );
}
