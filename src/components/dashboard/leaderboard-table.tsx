"use client";

import { useState } from "react";
import type { PlayerStats } from "@/types";

type SortKey = "total_profit" | "win_rate" | "avg_profit";

interface LeaderboardTableProps {
  stats: PlayerStats[];
}

export function LeaderboardTable({ stats }: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("total_profit");

  const sorted = [...stats].sort((a, b) => b[sortBy] - a[sortBy]);

  const tabs: { key: SortKey; label: string }[] = [
    { key: "total_profit", label: "Total Profit" },
    { key: "win_rate", label: "Win Rate" },
    { key: "avg_profit", label: "Avg/Session" },
  ];

  if (stats.length === 0) return null;

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSortBy(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              sortBy === tab.key
                ? "bg-gold/20 text-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {sorted.map((player, i) => {
          const displayVal =
            sortBy === "win_rate"
              ? `${Math.round(player.win_rate * 100)}%`
              : `$${player[sortBy].toFixed(2)}`;
          const isPositive =
            sortBy === "win_rate" ? player.win_rate > 0.5 : player[sortBy] > 0;

          return (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className="text-xl">{player.emoji}</span>
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {player.sessions_played} games &middot; {player.wins}W
                  </div>
                </div>
              </div>
              <span
                className={`font-mono font-bold ${
                  isPositive ? "text-profit" : "text-loss"
                }`}
              >
                {sortBy !== "win_rate" && player[sortBy] >= 0 ? "+" : ""}
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
