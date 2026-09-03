"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DailyPlayCount = { play_date: string; play_count: number };
type ArtistRanking = { artist_name: string; play_count: number };
type HourlyDistribution = { hour: number; play_count: number };

export default function AnalyticsCharts({
  dailyCounts,
  artistRanking,
  hourlyDist,
}: {
  dailyCounts: DailyPlayCount[];
  artistRanking: ArtistRanking[];
  hourlyDist: HourlyDistribution[];
}) {
  const dailyChartData = [...dailyCounts].reverse();

  const hourlyChartData = Array.from({ length: 24 }, (_, hour) => {
    const found = hourlyDist.find((h) => h.hour === hour);
    return { hour: `${hour}時`, play_count: found?.play_count ?? 0 };
  });

  return (
    <>
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-white">日別再生数</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="play_date" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46" }}
              />
              <Line
                type="monotone"
                dataKey="play_count"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-white">
          アーティストランキング
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={artistRanking.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis type="number" stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="artist_name"
                stroke="#a1a1aa"
                fontSize={12}
                width={120}
              />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46" }}
              />
              <Bar dataKey="play_count" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 text-white">時間帯別分布</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="hour" stroke="#a1a1aa" fontSize={12} interval={1} />
              <YAxis stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46" }}
              />
              <Bar dataKey="play_count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}