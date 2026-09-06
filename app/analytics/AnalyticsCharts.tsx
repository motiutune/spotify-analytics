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

type DailyPlayCount = {
  play_date: string;
  play_count: number;
};

type ArtistRanking = {
  artist_name: string;
  play_count: number;
};

type HourlyDistribution = {
  hour: number;
  play_count: number;
};

type TrackRanking = {
  track_name: string;
  artist_name: string;
  play_count: number;
};

type WeekdayDistribution = {
  weekday: string;
  play_count: number;
};

export default function AnalyticsCharts({
  dailyCounts,
  artistRanking,
  trackRanking,
  hourlyDist,
  weekdayDist,
}: {
  dailyCounts: DailyPlayCount[];
  artistRanking: ArtistRanking[];
  trackRanking: TrackRanking[];
  hourlyDist: HourlyDistribution[];
  weekdayDist: WeekdayDistribution[];
}) {
  // -----------------------------
  // 日別データ
  // -----------------------------

  const dailyChartData = dailyCounts.map((item) => {
    const date = new Date(item.play_date);

    return {
      ...item,

      display_date: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });

  // -----------------------------
  // 時間帯データ
  // -----------------------------

  const hourlyChartData = Array.from(
    { length: 24 },
    (_, hour) => {
      const found = hourlyDist.find(
        (item) => item.hour === hour
      );

      return {
        hour: `${hour}時`,
        play_count: found?.play_count ?? 0,
      };
    }
  );

  return (
    <>
      {/* 日別再生数 */}

      <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

        <div className="mb-6">
          <p className="text-sm font-medium text-green-400">
            DAILY ACTIVITY
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            日別再生数
          </h2>
        </div>

        <div className="h-72">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={dailyChartData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#3f3f46"
              />

              <XAxis
                dataKey="display_date"
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
              />

              <YAxis
                stroke="#a1a1aa"
                fontSize={12}
                allowDecimals={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border:
                    "1px solid #3f3f46",
                  borderRadius: "12px",
                }}
                labelStyle={{
                  color: "#ffffff",
                }}
                formatter={(value) => [
                  `${value}回`,
                  "再生数",
                ]}
              />

              <Line
                type="monotone"
                dataKey="play_count"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </section>

      {/* Artist Ranking */}

      <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

        <div className="mb-6">
          <p className="text-sm font-medium text-green-400">
            TOP ARTISTS
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            アーティストランキング
          </h2>
        </div>

        <div className="h-96">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={artistRanking.slice(
                0,
                10
              )}
              layout="vertical"
              margin={{
                left: 20,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#3f3f46"
              />

              <XAxis
                type="number"
                stroke="#a1a1aa"
                fontSize={12}
                allowDecimals={false}
                tickLine={false}
              />

              <YAxis
                type="category"
                dataKey="artist_name"
                stroke="#a1a1aa"
                fontSize={12}
                width={130}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border:
                    "1px solid #3f3f46",
                  borderRadius: "12px",
                }}
                formatter={(value) => [
                  `${value}回`,
                  "再生数",
                ]}
              />

              <Bar
                dataKey="play_count"
                fill="#22c55e"
                radius={[
                  0,
                  6,
                  6,
                  0,
                ]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </section>

      {/* Track Ranking */}

<section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

  <div className="mb-6">
    <p className="text-sm font-medium text-green-400">
      TOP TRACKS
    </p>

    <h2 className="mt-1 text-xl font-bold text-white">
      曲ランキング
    </h2>
  </div>

  <div className="space-y-2">

    {trackRanking.map((track, index) => (
      <div
        key={`${track.track_name}-${track.artist_name}`}
        className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-white/[0.04]"
      >
        <span className="w-8 text-center text-sm font-bold text-zinc-500">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">
            {track.track_name}
          </p>

          <p className="truncate text-sm text-zinc-500">
            {track.artist_name}
          </p>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold text-green-400">
            {track.play_count}
          </span>

          <span className="ml-1 text-sm text-zinc-500">
            回
          </span>
        </div>
      </div>
    ))}

  </div>

</section>

{/* 曜日別再生数 */}

<section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

  <div className="mb-6">
    <p className="text-sm font-medium text-green-400">
      WEEKLY PATTERN
    </p>

    <h2 className="mt-1 text-xl font-bold text-white">
      曜日別再生数
    </h2>
  </div>

  <div className="h-72">
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <BarChart data={weekdayDist}>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#3f3f46"
        />

        <XAxis
          dataKey="weekday"
          stroke="#a1a1aa"
          fontSize={12}
          tickLine={false}
        />

        <YAxis
          stroke="#a1a1aa"
          fontSize={12}
          allowDecimals={false}
          tickLine={false}
        />

        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "12px",
          }}
          formatter={(value) => [
            `${value}回`,
            "再生数",
          ]}
        />

        <Bar
          dataKey="play_count"
          fill="#22c55e"
          radius={[5, 5, 0, 0]}
        />

      </BarChart>
    </ResponsiveContainer>
  </div>

</section>

      {/* 時間帯分析 */}

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

        <div className="mb-6">
          <p className="text-sm font-medium text-green-400">
            LISTENING TIME
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            時間帯別分布
          </h2>
        </div>

        <div className="h-72">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={hourlyChartData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#3f3f46"
              />

              <XAxis
                dataKey="hour"
                stroke="#a1a1aa"
                fontSize={11}
                interval={1}
                tickLine={false}
              />

              <YAxis
                stroke="#a1a1aa"
                fontSize={12}
                allowDecimals={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border:
                    "1px solid #3f3f46",
                  borderRadius: "12px",
                }}
                formatter={(value) => [
                  `${value}回`,
                  "再生数",
                ]}
              />

              <Bar
                dataKey="play_count"
                fill="#22c55e"
                radius={[
                  5,
                  5,
                  0,
                  0,
                ]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </section>
    </>
  );
}