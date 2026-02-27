"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CumulativeProfitPoint } from "@/types";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#ec4899"];

interface ProfitChartProps {
  data: CumulativeProfitPoint[];
  playerNames: string[];
}

export function ProfitChart({ data, playerNames }: ProfitChartProps) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis
          dataKey="date"
          stroke="#666"
          fontSize={12}
          tickFormatter={(d) => {
            const date = new Date(d + "T00:00:00");
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1a2e1a", border: "1px solid #2d4a2d", borderRadius: "8px" }}
          labelStyle={{ color: "#d4a543" }}
          formatter={(value: number | undefined) => value != null ? [`$${value.toFixed(2)}`, undefined] : ["", undefined]}
          labelFormatter={(label) => {
            const date = new Date(label + "T00:00:00");
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }}
        />
        <Legend />
        {playerNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
