"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank, getLevel, getNextLevel, getLevelProgress, formatDate } from "@/lib/gameData";

type Period = "jour" | "semaine" | "mois" | "annee";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rate(calls: number, bookings: number) {
  if (calls === 0) return "—";
  return `${((bookings / calls) * 100).toFixed(1)}%`;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toYYYYMMDD(d: Date) {
  return d.toISOString().split("T")[0];
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────────

function BarChart({
  data,
  labelKey,
}: {
  data: { label: string; calls: number; bookings: number; isHighlight?: boolean }[];
  labelKey?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxCalls = Math.max(...data.map((d) => d.calls), 1);

  return (
    <div className="flex items-end gap-1" style={{ height: "9rem" }}>
      {data.map((d, i) => {
        const h = Math.max((d.calls / maxCalls) * 100, d.calls > 0 ? 4 : 0);
        const isH = hovered === i;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}
          >
            {isH && (
              <div
                className="absolute z-10 rounded border px-2 py-1 text-xs whitespace-nowrap pointer-events-none"
                style={{
                  bottom: "calc(100% + 6px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#141628",
                  borderColor: "#2a2d55",
                  color: "#e2e8f0",
                }}
              >
                {d.calls} calls{d.bookings > 0 ? `, ${d.bookings} RDV` : ""}
              </div>
            )}
            {/* Bar */}
            <div
              style={{
                width: "100%",
                height: `${h}%`,
                minHeight: d.calls > 0 ? "4px" : "2px",
                borderRadius: "3px 3px 0 0",
                background: d.bookings > 0
                  ? "linear-gradient(to top, #16a34a, #22c55e)"
                  : d.isHighlight
                  ? "linear-gradient(to top, #2563eb, #60a5fa)"
                  : "linear-gradient(to top, #1e293b, #334155)",
                opacity: isH ? 1 : 0.8,
                transition: "opacity 0.15s",
              }}
            />
            {/* Label */}
            <div
              className="font-game text-center"
              style={{
                fontSize: "0.6rem",
                color: d.isHighlight ? "#60a5fa" : "#4b5563",
                whiteSpace: "nowrap",
                overflow: "hidden",
                maxWidth: "100%",
                textOverflow: "ellipsis",
              }}
            >
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Cards ────────────────────────────────────────────────────────────────

function StatCards({
  items,
}: {
  items: { label: string; value: string | number; icon: string; color: string }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((s) => (
        <div key={s.label} className="bg-game-card border border-game-border rounded-xl p-4 text-center">
          <div className="text-xl mb-1">{s.icon}</div>
          <div className="font-game text-2xl stat-value" style={{ color: s.color }}>
            {s.value}
          </div>
          <div className="text-xs text-gray-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Period Views ──────────────────────────────────────────────────────────────

function JourView() {
  const { state } = useGame();
  const today = state.lastResetDate;
  const energy = 100 - state.dailyEnergyUsed;

  return (
    <div className="space-y-4">
      <StatCards items={[
        { label: "Calls aujourd'hui", value: state.dailyCalls, icon: "📞", color: "#3b82f6" },
        { label: "Bookings", value: state.dailyBookings, icon: "🎯", color: "#22c55e" },
        { label: "Taux", value: rate(state.dailyCalls, state.dailyBookings), icon: "📊", color: "#f6ad55" },
        { label: "Énergie restante", value: `${energy}%`, icon: "⚡", color: energy > 60 ? "#22c55e" : energy > 30 ? "#eab308" : "#ef4444" },
      ]} />

      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-3">PROGRESSION JOURNALIÈRE</div>
        <div className="space-y-3">
          {[
            { label: "Objectif calls (20)", value: state.dailyCalls, target: 20, color: "#3b82f6" },
            { label: "Énergie utilisée", value: state.dailyEnergyUsed, target: 100, color: "#eab308" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{item.label}</span>
                <span style={{ color: item.color }}>{item.value} / {item.target}</span>
              </div>
              <div className="h-2 bg-game-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar"
                  style={{
                    width: `${Math.min((item.value / item.target) * 100, 100)}%`,
                    background: item.color,
                    boxShadow: `0 0 6px ${item.color}60`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {state.sessionActive && (
        <div className="bg-game-card border border-purple-500/30 rounded-xl p-4">
          <div className="font-game text-xs tracking-widest text-purple-400 mb-2">SESSION EN COURS</div>
          <div className="flex gap-6">
            <div>
              <div className="font-game text-2xl text-purple-400">{state.sessionCalls}</div>
              <div className="text-xs text-gray-500">calls session</div>
            </div>
            <div>
              <div className="font-game text-2xl text-green-400">{state.sessionBookings}</div>
              <div className="text-xs text-gray-500">bookings session</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SemaineView() {
  const { state } = useGame();
  const today = new Date();
  const weekStart = getWeekStart(today);

  const days: { label: string; calls: number; bookings: number; isHighlight: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = toYYYYMMDD(d);
    const isToday = dateStr === state.lastResetDate;
    const dayData = isToday
      ? { calls: state.dailyCalls, bookings: state.dailyBookings }
      : state.history.find((h) => h.date === dateStr) ?? { calls: 0, bookings: 0 };
    const label = d.toLocaleDateString("fr-FR", { weekday: "short" });
    days.push({ label, calls: dayData.calls, bookings: dayData.bookings, isHighlight: isToday });
  }

  const weeklyCalls = state.totalCalls - state.weeklyCallsAtStart;
  const weeklyBookings = state.totalBookings - state.weeklyBookingsAtStart;
  const bestDay = days.reduce((b, d) => (d.calls > b.calls ? d : b), days[0]);

  return (
    <div className="space-y-4">
      <StatCards items={[
        { label: "Calls semaine", value: weeklyCalls, icon: "📞", color: "#3b82f6" },
        { label: "Bookings", value: weeklyBookings, icon: "🎯", color: "#22c55e" },
        { label: "Taux", value: rate(weeklyCalls, weeklyBookings), icon: "📊", color: "#f6ad55" },
        { label: "Jours actifs", value: `${state.weeklyDaysActive}/7`, icon: "📅", color: "#a78bfa" },
      ]} />
      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-4">CETTE SEMAINE — PAR JOUR</div>
        <BarChart data={days} />
      </div>
      {bestDay.calls > 0 && (
        <div className="bg-game-card border border-game-border rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-game text-sm text-white">Meilleur jour</div>
              <div className="text-xs text-gray-500">{bestDay.label}</div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="font-game text-lg text-blue-400">{bestDay.calls}</div>
              <div className="text-xs text-gray-600">calls</div>
            </div>
            <div>
              <div className="font-game text-lg text-green-400">{bestDay.bookings}</div>
              <div className="text-xs text-gray-600">RDV</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MoisView() {
  const { state } = useGame();
  const now = new Date();
  const currentMonth = toYYYYMMDD(now).slice(0, 7);

  // Build daily data for current month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthDays: { label: string; calls: number; bookings: number; isHighlight: boolean }[] = [];
  let monthCalls = 0;
  let monthBookings = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonth}-${String(d).padStart(2, "0")}`;
    const isToday = dateStr === state.lastResetDate;
    const isFuture = new Date(dateStr + "T12:00:00") > now && !isToday;
    if (isFuture) continue;
    const dayData = isToday
      ? { calls: state.dailyCalls, bookings: state.dailyBookings }
      : state.history.find((h) => h.date === dateStr) ?? { calls: 0, bookings: 0 };
    monthCalls += dayData.calls;
    monthBookings += dayData.bookings;
    monthDays.push({ label: String(d), calls: dayData.calls, bookings: dayData.bookings, isHighlight: isToday });
  }

  const bestWeeks = [0, 1, 2, 3, 4].map((w) => {
    const weekDays = monthDays.slice(w * 7, (w + 1) * 7);
    if (weekDays.length === 0) return null;
    return {
      label: `S${w + 1}`,
      calls: weekDays.reduce((s, d) => s + d.calls, 0),
      bookings: weekDays.reduce((s, d) => s + d.bookings, 0),
      isHighlight: false,
    };
  }).filter(Boolean) as { label: string; calls: number; bookings: number; isHighlight: boolean }[];

  const activeDays = monthDays.filter((d) => d.calls > 0).length;
  const bestDay = monthDays.reduce((b, d) => (d.calls > b.calls ? d : b), monthDays[0] ?? { calls: 0, bookings: 0, label: "", isHighlight: false });
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <StatCards items={[
        { label: "Calls ce mois", value: monthCalls, icon: "📞", color: "#3b82f6" },
        { label: "Bookings", value: monthBookings, icon: "🎯", color: "#22c55e" },
        { label: "Taux", value: rate(monthCalls, monthBookings), icon: "📊", color: "#f6ad55" },
        { label: "Jours actifs", value: `${activeDays}/${daysInMonth}`, icon: "📅", color: "#a78bfa" },
      ]} />

      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-1">PAR SEMAINE — {monthName.toUpperCase()}</div>
        <BarChart data={bestWeeks} />
      </div>

      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-4">PAR JOUR — {monthName.toUpperCase()}</div>
        <BarChart data={monthDays} />
      </div>

      {bestDay.calls > 0 && (
        <div className="bg-game-card border border-game-border rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-game text-sm text-white">Meilleur jour du mois</div>
              <div className="text-xs text-gray-500">Jour {bestDay.label}</div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div><div className="font-game text-lg text-blue-400">{bestDay.calls}</div><div className="text-xs text-gray-600">calls</div></div>
            <div><div className="font-game text-lg text-green-400">{bestDay.bookings}</div><div className="text-xs text-gray-600">RDV</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnneeView() {
  const { state } = useGame();
  const now = new Date();
  const currentYear = now.getFullYear();

  // Aggregate by month
  const allDays = [
    ...state.history,
    ...(state.dailyCalls > 0 || state.dailyBookings > 0
      ? [{ date: state.lastResetDate, calls: state.dailyCalls, bookings: state.dailyBookings }]
      : []),
  ];

  const monthMap: Record<string, { calls: number; bookings: number }> = {};
  for (const day of allDays) {
    const month = day.date.slice(0, 7);
    if (!month.startsWith(String(currentYear))) continue;
    if (!monthMap[month]) monthMap[month] = { calls: 0, bookings: 0 };
    monthMap[month].calls += day.calls;
    monthMap[month].bookings += day.bookings;
  }

  const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, "0");
  const monthLabels = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  const chartData = months
    .filter((m) => `${currentYear}-${m}` <= `${currentYear}-${currentMonthNum}`)
    .map((m, i) => {
      const key = `${currentYear}-${m}`;
      const data = monthMap[key] ?? { calls: 0, bookings: 0 };
      return { label: monthLabels[i], calls: data.calls, bookings: data.bookings, isHighlight: m === currentMonthNum };
    });

  const yearCalls = chartData.reduce((s, d) => s + d.calls, 0);
  const yearBookings = chartData.reduce((s, d) => s + d.bookings, 0);
  const activeDays = allDays.filter((d) => d.date.startsWith(String(currentYear)) && d.calls > 0).length;
  const bestMonth = chartData.reduce((b, d) => (d.calls > b.calls ? d : b), chartData[0] ?? { calls: 0, bookings: 0, label: "—", isHighlight: false });

  return (
    <div className="space-y-4">
      <StatCards items={[
        { label: `Calls ${currentYear}`, value: yearCalls.toLocaleString("fr-FR"), icon: "📞", color: "#3b82f6" },
        { label: "Bookings", value: yearBookings, icon: "🎯", color: "#22c55e" },
        { label: "Taux", value: rate(yearCalls, yearBookings), icon: "📊", color: "#f6ad55" },
        { label: "Jours actifs", value: activeDays, icon: "📅", color: "#a78bfa" },
      ]} />

      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-4">PAR MOIS — {currentYear}</div>
        <BarChart data={chartData} />
      </div>

      {bestMonth.calls > 0 && (
        <div className="bg-game-card border border-game-border rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-game text-sm text-white">Meilleur mois</div>
              <div className="text-xs text-gray-500">{bestMonth.label} {currentYear}</div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div><div className="font-game text-lg text-blue-400">{bestMonth.calls}</div><div className="text-xs text-gray-600">calls</div></div>
            <div><div className="font-game text-lg text-green-400">{bestMonth.bookings}</div><div className="text-xs text-gray-600">RDV</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const PERIODS: { id: Period; label: string; icon: string }[] = [
  { id: "jour", label: "Aujourd'hui", icon: "☀️" },
  { id: "semaine", label: "Semaine", icon: "📆" },
  { id: "mois", label: "Mois", icon: "🗓️" },
  { id: "annee", label: "Année", icon: "📈" },
];

export default function StatsTab() {
  const { state } = useGame();
  const [period, setPeriod] = useState<Period>("semaine");

  const rank = getRank(state.totalBookings);
  const nextRank = getNextRank(state.totalBookings);
  const level = getLevel(state.totalXP);
  const nextLevel = getNextLevel(state.totalXP);
  const lvlProgress = getLevelProgress(state.totalXP);
  const rankColor = rank.color;

  const rankGroupClass =
    rank.group === "global" ? "rank-global" :
    rank.group === "supreme" ? "rank-supreme" :
    rank.group === "eagle" ? "rank-eagle" :
    rank.group === "guardian" ? "rank-guardian" :
    rank.group === "gold" ? "rank-gold" : "";

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="grid grid-cols-4 gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="py-2.5 rounded-xl font-game text-xs tracking-wider transition-all duration-150"
            style={{
              background: period === p.id ? "rgba(30,58,138,0.6)" : "rgba(20,22,40,0.8)",
              border: `1px solid ${period === p.id ? "#3b82f6" : "#1e2040"}`,
              color: period === p.id ? "#60a5fa" : "#6b7280",
              boxShadow: period === p.id ? "0 0 10px rgba(59,130,246,0.25)" : "none",
            }}
          >
            <div className="text-base mb-0.5">{p.icon}</div>
            <div className="hidden sm:block">{p.label.toUpperCase()}</div>
          </button>
        ))}
      </div>

      {/* Period content */}
      {period === "jour" && <JourView />}
      {period === "semaine" && <SemaineView />}
      {period === "mois" && <MoisView />}
      {period === "annee" && <AnneeView />}

      {/* Rank & Level always visible */}
      <div className="bg-game-card border border-game-border rounded-xl p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 80% 50%, ${rankColor} 0%, transparent 60%)` }} />
        <div className="relative">
          <div className="font-game text-xs tracking-widest text-gray-500 mb-3">RANG CS:GO</div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`font-game text-2xl ${rankGroupClass}`} style={{ color: rankGroupClass ? undefined : rankColor }}>{rank.name}</div>
              <div className="text-sm text-gray-500 mt-1">{state.totalBookings} bookings</div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: rankColor, background: `radial-gradient(circle, ${rankColor}20 0%, transparent 70%)`, boxShadow: `0 0 20px ${rankColor}30` }}>
              <span className="text-2xl">{rank.group === "global" ? "👑" : rank.group === "supreme" ? "⭐" : rank.group === "eagle" ? "🦅" : rank.group === "guardian" ? "🛡️" : rank.group === "gold" ? "🏅" : "🥈"}</span>
            </div>
          </div>
          {nextRank ? (
            <>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">Prochain: </span>
                <span className="font-game text-xs" style={{ color: nextRank.color }}>{nextRank.name}</span>
              </div>
              <div className="h-2 bg-game-border rounded-full overflow-hidden">
                <div className="h-full rounded-full progress-bar"
                  style={{ width: `${Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)}%`, background: `linear-gradient(90deg, ${rankColor}80, ${rankColor})`, boxShadow: `0 0 6px ${rankColor}40` }} />
              </div>
              <div className="text-xs text-gray-600 mt-1">{nextRank.minBookings - state.totalBookings} bookings manquants</div>
            </>
          ) : (
            <div className="font-game text-sm text-green-400 text-center">🏆 GLOBAL ELITE</div>
          )}
        </div>
      </div>

      <div className="bg-game-card border border-game-border rounded-xl p-4">
        <div className="font-game text-xs tracking-widest text-gray-500 mb-3">NIVEAU & XP</div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg border border-blue-500/40 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)" }}>
              <span className="font-game text-blue-300">{level.level}</span>
            </div>
            <div>
              <div className="font-game text-base text-blue-400">{level.title}</div>
              <div className="text-xs text-gray-500">Niveau {level.level}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-game text-xl text-yellow-400">{state.totalXP.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-gray-500">XP total</div>
          </div>
        </div>
        {nextLevel && (
          <>
            <div className="h-2 bg-game-border rounded-full overflow-hidden mb-1">
              <div className="xp-bar-fill h-full rounded-full" style={{ width: `${lvlProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Niv. {level.level}</span>
              <span>{lvlProgress}%</span>
              <span>Niv. {nextLevel.level} — {nextLevel.title}</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Streak actuel", value: `${state.currentStreak}j`, icon: "🔥", color: "#f97316" },
          { label: "Record streak", value: `${state.longestStreak}j`, icon: "🏅", color: "#ffd700" },
          { label: "Full énergie", value: `${state.fullEnergyCount}x`, icon: "⚡", color: "#fbbf24" },
          { label: "Hauts faits", value: `${state.unlockedAchievements.length}/31`, icon: "🏆", color: "#c084fc" },
        ].map((s) => (
          <div key={s.label} className="bg-game-card border border-game-border rounded-xl p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="font-game text-xl" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
