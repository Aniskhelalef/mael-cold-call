"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameContext";
import { getRank, getNextRank, getLevel, getNextLevel, getLevelProgress } from "@/lib/gameData";

type Period = "jour" | "semaine" | "mois" | "annee";

const CARD_BG = "#1C1C1C";
const BORDER  = "#2A2A2A";

function rate(calls: number, bookings: number) {
  if (calls === 0) return "—";
  return `${((bookings / calls) * 100).toFixed(1)}%`;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toYYYYMMDD(d: Date) {
  return d.toISOString().split("T")[0];
}

// ── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data }: {
  data: { label: string; calls: number; bookings: number; isHighlight?: boolean }[];
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxCalls = Math.max(...data.map((d) => d.calls), 1);

  return (
    <div className="flex items-end gap-1" style={{ height: "8rem" }}>
      {data.map((d, i) => {
        const h = Math.max((d.calls / maxCalls) * 100, d.calls > 0 ? 4 : 0);
        const isH = hovered === i;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 relative"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}
          >
            {isH && (
              <div
                className="absolute z-10 rounded-sm px-2 py-1 text-xs whitespace-nowrap pointer-events-none font-game"
                style={{
                  bottom: "calc(100% + 6px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#242424",
                  border: "1px solid #383838",
                  color: "#FFFFFF",
                  fontSize: "0.65rem",
                }}
              >
                {d.calls} calls{d.bookings > 0 ? ` · ${d.bookings} RDV` : ""}
              </div>
            )}
            <div
              style={{
                width: "100%",
                height: `${h}%`,
                minHeight: d.calls > 0 ? "4px" : "2px",
                borderRadius: "2px 2px 0 0",
                background: d.bookings > 0
                  ? "linear-gradient(to top,#16a34a,#22c55e)"
                  : d.isHighlight
                  ? "linear-gradient(to top,#CC4400,#FF5500)"
                  : "#2A2A2A",
                opacity: isH ? 1 : 0.85,
                transition: "opacity 0.15s",
                boxShadow: d.isHighlight && d.calls > 0 ? "0 0 4px rgba(255,85,0,0.4)" : "none",
              }}
            />
            <div
              className="font-game text-center"
              style={{
                fontSize: "0.55rem",
                color: d.isHighlight ? "#FF5500" : "#3A3A3A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                maxWidth: "100%",
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

// ── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards({ items }: {
  items: { label: string; value: string | number; icon: string; color: string }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-sm p-3"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-game text-[10px] tracking-widest" style={{ color: "#5A5A5A" }}>
              {s.label.toUpperCase()}
            </span>
            <span style={{ fontSize: "0.8rem" }}>{s.icon}</span>
          </div>
          <div className="font-game text-2xl stat-value leading-none" style={{ color: s.color }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Period Views ─────────────────────────────────────────────────────────────

function JourView() {
  const { state } = useGame();
  const energy = 100 - state.dailyEnergyUsed;

  return (
    <div className="space-y-3">
      <StatCards items={[
        { label: "Calls",    value: state.dailyCalls,    icon: "📞", color: "#FF5500" },
        { label: "RDV",      value: state.dailyBookings, icon: "🎯", color: "#1CE400" },
        { label: "Taux",     value: rate(state.dailyCalls, state.dailyBookings), icon: "📊", color: "#FF9500" },
        { label: "Énergie",  value: `${energy}%`,        icon: "⚡", color: energy > 60 ? "#1CE400" : energy > 30 ? "#eab308" : "#ef4444" },
      ]} />

      <div className="rounded-sm p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#5A5A5A" }}>
          PROGRESSION JOURNALIÈRE
        </div>
        <div className="space-y-3">
          {[
            { label: "Objectif calls (20)", value: state.dailyCalls,      target: 20,  color: "#FF5500" },
            { label: "Énergie utilisée",    value: state.dailyEnergyUsed, target: 100, color: "#FF9500" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1" style={{ color: "#9A9A9A" }}>
                <span>{item.label}</span>
                <span style={{ color: item.color }}>{item.value} / {item.target}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2A2A2A" }}>
                <div
                  className="h-full rounded-full progress-bar"
                  style={{
                    width: `${Math.min((item.value / item.target) * 100, 100)}%`,
                    background: item.color,
                    boxShadow: `0 0 5px ${item.color}50`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {state.sessionActive && (
        <div
          className="rounded-sm p-4"
          style={{ background: CARD_BG, border: "1px solid rgba(174,0,252,0.3)" }}
        >
          <div className="font-game text-[10px] tracking-widest mb-2" style={{ color: "#AE00FC" }}>
            SESSION EN COURS
          </div>
          <div className="flex gap-6">
            <div>
              <div className="font-game text-2xl" style={{ color: "#AE00FC" }}>{state.sessionCalls}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.68rem" }}>calls session</div>
            </div>
            <div>
              <div className="font-game text-2xl" style={{ color: "#1CE400" }}>{state.sessionBookings}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.68rem" }}>RDV session</div>
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

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = toYYYYMMDD(d);
    const isToday = dateStr === state.lastResetDate;
    const dayData = isToday
      ? { calls: state.dailyCalls, bookings: state.dailyBookings }
      : state.history.find((h) => h.date === dateStr) ?? { calls: 0, bookings: 0 };
    return {
      label:       d.toLocaleDateString("fr-FR", { weekday: "short" }),
      calls:       dayData.calls,
      bookings:    dayData.bookings,
      isHighlight: isToday,
    };
  });

  const weeklyCalls    = state.totalCalls    - state.weeklyCallsAtStart;
  const weeklyBookings = state.totalBookings - state.weeklyBookingsAtStart;
  const bestDay        = days.reduce((b, d) => (d.calls > b.calls ? d : b), days[0]);

  return (
    <div className="space-y-3">
      <StatCards items={[
        { label: "Calls",        value: weeklyCalls,             icon: "📞", color: "#FF5500" },
        { label: "RDV",          value: weeklyBookings,          icon: "🎯", color: "#1CE400" },
        { label: "Taux",         value: rate(weeklyCalls, weeklyBookings), icon: "📊", color: "#FF9500" },
        { label: "Jours actifs", value: `${state.weeklyDaysActive}/7`, icon: "📅", color: "#5DC7E5" },
      ]} />

      <div className="rounded-sm p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="font-game text-[10px] tracking-widest mb-4" style={{ color: "#5A5A5A" }}>
          CETTE SEMAINE — PAR JOUR
        </div>
        <BarChart data={days} />
      </div>

      {bestDay.calls > 0 && (
        <div
          className="rounded-sm p-3 flex items-center justify-between"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.4rem" }}>🏆</span>
            <div>
              <div className="font-game text-xs text-white">Meilleur jour</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.68rem" }}>{bestDay.label}</div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="font-game text-lg" style={{ color: "#FF5500" }}>{bestDay.calls}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.6rem" }}>calls</div>
            </div>
            <div>
              <div className="font-game text-lg" style={{ color: "#1CE400" }}>{bestDay.bookings}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.6rem" }}>RDV</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MoisView() {
  const { state } = useGame();
  const now          = new Date();
  const currentMonth = toYYYYMMDD(now).slice(0, 7);
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  let monthCalls = 0, monthBookings = 0;
  const monthDays: { label: string; calls: number; bookings: number; isHighlight: boolean }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonth}-${String(d).padStart(2, "0")}`;
    const isToday = dateStr === state.lastResetDate;
    if (new Date(dateStr + "T12:00:00") > now && !isToday) continue;
    const dayData = isToday
      ? { calls: state.dailyCalls, bookings: state.dailyBookings }
      : state.history.find((h) => h.date === dateStr) ?? { calls: 0, bookings: 0 };
    monthCalls    += dayData.calls;
    monthBookings += dayData.bookings;
    monthDays.push({ label: String(d), calls: dayData.calls, bookings: dayData.bookings, isHighlight: isToday });
  }

  const activeDays = monthDays.filter((d) => d.calls > 0).length;
  const bestDay    = monthDays.reduce((b, d) => (d.calls > b.calls ? d : b), monthDays[0] ?? { calls: 0, bookings: 0, label: "—", isHighlight: false });
  const monthName  = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      <StatCards items={[
        { label: "Calls",        value: monthCalls,    icon: "📞", color: "#FF5500" },
        { label: "RDV",          value: monthBookings, icon: "🎯", color: "#1CE400" },
        { label: "Taux",         value: rate(monthCalls, monthBookings), icon: "📊", color: "#FF9500" },
        { label: "Jours actifs", value: `${activeDays}/${daysInMonth}`, icon: "📅", color: "#5DC7E5" },
      ]} />

      <div className="rounded-sm p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="font-game text-[10px] tracking-widest mb-4" style={{ color: "#5A5A5A" }}>
          PAR JOUR — {monthName.toUpperCase()}
        </div>
        <BarChart data={monthDays} />
      </div>

      {bestDay.calls > 0 && (
        <div
          className="rounded-sm p-3 flex items-center justify-between"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.4rem" }}>🏆</span>
            <div>
              <div className="font-game text-xs text-white">Meilleur jour du mois</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.68rem" }}>Jour {bestDay.label}</div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="font-game text-lg" style={{ color: "#FF5500" }}>{bestDay.calls}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.6rem" }}>calls</div>
            </div>
            <div>
              <div className="font-game text-lg" style={{ color: "#1CE400" }}>{bestDay.bookings}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.6rem" }}>RDV</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnneeView() {
  const { state } = useGame();
  const now         = new Date();
  const currentYear = now.getFullYear();

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
    monthMap[month].calls    += day.calls;
    monthMap[month].bookings += day.bookings;
  }

  const currentMonthNum = String(now.getMonth() + 1).padStart(2, "0");
  const monthLabels = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const chartData = ["01","02","03","04","05","06","07","08","09","10","11","12"]
    .filter((m) => `${currentYear}-${m}` <= `${currentYear}-${currentMonthNum}`)
    .map((m, i) => {
      const data = monthMap[`${currentYear}-${m}`] ?? { calls: 0, bookings: 0 };
      return { label: monthLabels[i], ...data, isHighlight: m === currentMonthNum };
    });

  const yearCalls    = chartData.reduce((s, d) => s + d.calls, 0);
  const yearBookings = chartData.reduce((s, d) => s + d.bookings, 0);
  const activeDays   = allDays.filter((d) => d.date.startsWith(String(currentYear)) && d.calls > 0).length;
  const bestMonth    = chartData.reduce((b, d) => (d.calls > b.calls ? d : b), chartData[0] ?? { calls: 0, bookings: 0, label: "—", isHighlight: false });

  return (
    <div className="space-y-3">
      <StatCards items={[
        { label: `Calls ${currentYear}`, value: yearCalls.toLocaleString("fr-FR"), icon: "📞", color: "#FF5500" },
        { label: "RDV",          value: yearBookings,  icon: "🎯", color: "#1CE400" },
        { label: "Taux",         value: rate(yearCalls, yearBookings), icon: "📊", color: "#FF9500" },
        { label: "Jours actifs", value: activeDays,    icon: "📅", color: "#5DC7E5" },
      ]} />

      <div className="rounded-sm p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="font-game text-[10px] tracking-widest mb-4" style={{ color: "#5A5A5A" }}>
          PAR MOIS — {currentYear}
        </div>
        <BarChart data={chartData} />
      </div>

      {bestMonth.calls > 0 && (
        <div
          className="rounded-sm p-3 flex items-center justify-between"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.4rem" }}>🏆</span>
            <div>
              <div className="font-game text-xs text-white">Meilleur mois</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.68rem" }}>{bestMonth.label} {currentYear}</div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="font-game text-lg" style={{ color: "#FF5500" }}>{bestMonth.calls}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.6rem" }}>calls</div>
            </div>
            <div>
              <div className="font-game text-lg" style={{ color: "#1CE400" }}>{bestMonth.bookings}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.6rem" }}>RDV</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

const PERIODS: { id: Period; label: string }[] = [
  { id: "jour",    label: "Aujourd'hui" },
  { id: "semaine", label: "Semaine"     },
  { id: "mois",    label: "Mois"        },
  { id: "annee",   label: "Année"       },
];

export default function StatsTab() {
  const { state }  = useGame();
  const [period, setPeriod] = useState<Period>("semaine");

  const rank      = getRank(state.totalBookings);
  const nextRank  = getNextRank(state.totalBookings);
  const level     = getLevel(state.totalXP);
  const nextLevel = getNextLevel(state.totalXP);
  const lvlPct    = getLevelProgress(state.totalXP);

  const rankGroupClass =
    rank.group === "global"   ? "rank-global"   :
    rank.group === "supreme"  ? "rank-supreme"  :
    rank.group === "eagle"    ? "rank-eagle"    :
    rank.group === "guardian" ? "rank-guardian" :
    rank.group === "gold"     ? "rank-gold"     : "";

  return (
    <div className="space-y-3 max-w-3xl mx-auto">

      {/* Period selector */}
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="flex-1 py-2 rounded-sm font-game text-[10px] tracking-wider transition-all duration-100"
            style={{
              background: period === p.id ? "#FF5500" : CARD_BG,
              border:     `1px solid ${period === p.id ? "#FF5500" : BORDER}`,
              color:      period === p.id ? "#FFF" : "#9A9A9A",
            }}
          >
            {p.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Period content */}
      {period === "jour"    && <JourView />}
      {period === "semaine" && <SemaineView />}
      {period === "mois"    && <MoisView />}
      {period === "annee"   && <AnneeView />}

      {/* Rank card */}
      <div className="rounded-sm p-4 relative overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ background: `radial-gradient(circle at 80% 50%,${rank.color} 0%,transparent 60%)` }} />
        <div className="relative">
          <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#5A5A5A" }}>
            RANG CS:GO
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div
                className={`font-game text-xl ${rankGroupClass}`}
                style={{ color: rankGroupClass ? undefined : rank.color }}
              >
                {rank.name}
              </div>
              <div style={{ color: "#5A5A5A", fontSize: "0.7rem", marginTop: "2px" }}>
                {state.totalBookings} RDV au total
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: rank.color,
                background:  `${rank.color}12`,
                boxShadow:   `0 0 12px ${rank.color}30`,
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>
                {rank.group === "global" ? "👑" : rank.group === "supreme" ? "⭐" :
                 rank.group === "eagle" ? "🦅" : rank.group === "guardian" ? "🛡️" :
                 rank.group === "gold" ? "🏅" : "🥈"}
              </span>
            </div>
          </div>
          {nextRank ? (
            <>
              <div className="flex justify-between mb-1.5" style={{ fontSize: "0.68rem" }}>
                <span style={{ color: "#5A5A5A" }}>Prochain rang</span>
                <span className="font-game" style={{ color: nextRank.color }}>{nextRank.name}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2A2A2A" }}>
                <div
                  className="h-full rounded-full progress-bar"
                  style={{
                    width: `${Math.round(((state.totalBookings - rank.minBookings) / (nextRank.minBookings - rank.minBookings)) * 100)}%`,
                    background: rank.color,
                    boxShadow:  `0 0 5px ${rank.color}50`,
                  }}
                />
              </div>
              <div style={{ color: "#5A5A5A", fontSize: "0.63rem", marginTop: "4px" }}>
                {nextRank.minBookings - state.totalBookings} RDV manquants
              </div>
            </>
          ) : (
            <div className="font-game text-xs text-center" style={{ color: "#1CE400" }}>🏆 GLOBAL ELITE</div>
          )}
        </div>
      </div>

      {/* Level card */}
      <div className="rounded-sm p-4" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
        <div className="font-game text-[10px] tracking-widest mb-3" style={{ color: "#5A5A5A" }}>
          NIVEAU & XP
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-sm fi-level-badge level-shimmer"
              style={{
                width: "44px", height: "44px", fontSize: "1.1rem",
                background: "#242424", border: "1px solid #383838",
                color: "#FF5500",
              }}
            >
              {level.level}
            </div>
            <div>
              <div className="font-game text-sm" style={{ color: "#FF5500" }}>{level.title}</div>
              <div style={{ color: "#5A5A5A", fontSize: "0.68rem" }}>Niveau {level.level}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-game text-xl" style={{ color: "#FF9500" }}>
              {state.totalXP.toLocaleString("fr-FR")}
            </div>
            <div style={{ color: "#5A5A5A", fontSize: "0.65rem" }}>XP total</div>
          </div>
        </div>
        {nextLevel && (
          <>
            <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: "#2A2A2A" }}>
              <div className="xp-bar-fill h-full rounded-full" style={{ width: `${lvlPct}%` }} />
            </div>
            <div className="flex justify-between" style={{ fontSize: "0.6rem", color: "#5A5A5A" }}>
              <span>Niv. {level.level}</span>
              <span>{lvlPct}%</span>
              <span>Niv. {nextLevel.level} — {nextLevel.title}</span>
            </div>
          </>
        )}
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Streak actuel", value: `${state.currentStreak}j`, icon: "🔥", color: "#FF5500"  },
          { label: "Record streak", value: `${state.longestStreak}j`, icon: "🏅", color: "#FF9500"  },
          { label: "Full énergie",  value: `${state.fullEnergyCount}x`, icon: "⚡", color: "#5DC7E5" },
          { label: "Hauts faits",   value: `${state.unlockedAchievements.length}`, icon: "🎖", color: "#AE00FC" },
        ].map((s) => (
          <div key={s.label} className="rounded-sm p-3" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-game text-[10px] tracking-widest" style={{ color: "#5A5A5A" }}>
                {s.label.toUpperCase()}
              </span>
              <span style={{ fontSize: "0.8rem" }}>{s.icon}</span>
            </div>
            <div className="font-game text-xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
