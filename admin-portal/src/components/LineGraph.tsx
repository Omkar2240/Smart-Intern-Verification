"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface TrendSeries {
  name: string;
  data: TrendDataPoint[];
  color: string;
}

interface LineGraphProps {
  title: string;
  subtitle?: string;
  series: TrendSeries[];
  timePeriod?: "today" | "monthly" | "yearly" | "all";
  onPeriodChange?: (period: "today" | "monthly" | "yearly" | "all") => void;
  height?: number;
  className?: string;
}

const periodOptions = [
  { value: "today", label: "Today" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "all", label: "All Time" },
] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color?: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-slate-900 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-600 flex-1">{p.name}:</span>
          <span className="font-mono font-bold text-slate-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function LineGraph({
  title,
  subtitle,
  series,
  timePeriod = "monthly",
  onPeriodChange,
  height = 180,
  className,
}: LineGraphProps) {
  const handlePeriodChange = (
    period: "today" | "monthly" | "yearly" | "all",
  ) => {
    onPeriodChange?.(period);
  };

  // Merge all data points by date
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.data.map((d) => d.date))),
  ).sort();

  const chartData = allDates.map((date) => {
    const point: Record<string, string | number> = { date };
    series.forEach((s) => {
      const dataPoint = s.data.find((d) => d.date === date);
      point[s.name] = dataPoint?.count ?? 0;
    });
    return point;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={clsx(
        "bg-white border border-slate-200 rounded-2xl p-5 shadow-xs",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-mono">{subtitle}</p>
          )}
        </div>

        {onPeriodChange && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={clsx(
                  "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
                  timePeriod === option.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }}
              iconType="circle"
            />
            {series.map((s) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, fill: s.color }}
                activeDot={{ r: 5, fill: s.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[180px] flex items-center justify-center">
          <p className="text-[11px] text-slate-400 font-mono">
            No trend data available
          </p>
        </div>
      )}
    </motion.div>
  );
}
