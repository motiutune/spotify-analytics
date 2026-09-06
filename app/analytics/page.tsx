import {
  getHistoryByPeriod,
  Period,
} from "@/lib/analytics";

import AnalyticsCharts from "./AnalyticsCharts";

type AnalyticsPageProps = {
  searchParams: Promise<{
    period?: string;
  }>;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = await searchParams;

  const rawPeriod = params.period;

  const period: Period =
    rawPeriod === "7" ||
    rawPeriod === "30" ||
    rawPeriod === "all"
      ? rawPeriod
      : "30";

  // 選択期間の履歴取得
  const history = await getHistoryByPeriod(period);

  // -----------------------------
  // 日別再生数
  // -----------------------------

  const dailyMap = new Map<string, number>();

  for (const item of history) {
    const date = new Date(
      item.played_at
    ).toLocaleDateString("ja-JP");

    dailyMap.set(
      date,
      (dailyMap.get(date) ?? 0) + 1
    );
  }

  const dailyCounts = Array.from(
    dailyMap.entries()
  ).map(([play_date, play_count]) => ({
    play_date,
    play_count,
  }));

  // -----------------------------
  // アーティスト別再生数
  // -----------------------------

  const artistMap = new Map<string, number>();

  for (const item of history) {
    const artists = item.artist_name
      .split(",")
      .map((artist) => artist.trim())
      .filter(Boolean);

    for (const artist of artists) {
      artistMap.set(
        artist,
        (artistMap.get(artist) ?? 0) + 1
      );
    }
  }

  const artistRanking = Array.from(
    artistMap.entries()
  )
    .map(([artist_name, play_count]) => ({
      artist_name,
      play_count,
    }))
    .sort(
      (a, b) =>
        b.play_count - a.play_count
    )
    .slice(0, 10);

  // -----------------------------
// 曲別再生数
// -----------------------------

const trackMap = new Map<
  string,
  {
    track_name: string;
    artist_name: string;
    play_count: number;
  }
>();

for (const item of history) {
  const key = item.track_id;

  const existing = trackMap.get(key);

  if (existing) {
    existing.play_count += 1;
  } else {
    trackMap.set(key, {
      track_name: item.track_name,
      artist_name: item.artist_name,
      play_count: 1,
    });
  }
}

const trackRanking = Array.from(
  trackMap.values()
)
  .sort(
    (a, b) =>
      b.play_count - a.play_count
  )
  .slice(0, 10);

  // -----------------------------
  // 時間帯別再生数
  // -----------------------------

  const hourlyMap = new Map<number, number>();

  for (const item of history) {
    const hour = new Date(
      item.played_at
    ).getHours();

    hourlyMap.set(
      hour,
      (hourlyMap.get(hour) ?? 0) + 1
    );
  }

  const hourlyDist = Array.from(
    { length: 24 },
    (_, hour) => ({
      hour,
      play_count:
        hourlyMap.get(hour) ?? 0,
    })
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              分析
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              保存されたSpotify再生履歴を分析
            </p>
          </div>

          <a
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            ← Dashboardに戻る
          </a>
        </div>

        {/* 期間切り替え */}

        <div className="mb-8 flex gap-2">

          <a
            href="/analytics?period=7"
            className={`rounded-full px-4 py-2 text-sm transition ${
              period === "7"
                ? "bg-green-500 text-black font-semibold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            7日間
          </a>

          <a
            href="/analytics?period=30"
            className={`rounded-full px-4 py-2 text-sm transition ${
              period === "30"
                ? "bg-green-500 text-black font-semibold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            30日間
          </a>

          <a
            href="/analytics?period=all"
            className={`rounded-full px-4 py-2 text-sm transition ${
              period === "all"
                ? "bg-green-500 text-black font-semibold"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            全期間
          </a>

        </div>

        {/* 総再生数 */}

        <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-zinc-500">
            TOTAL PLAYS
          </p>

          <p className="mt-2 text-4xl font-bold">
            {history.length}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            選択期間の再生数
          </p>
        </div>

        <AnalyticsCharts
        dailyCounts={dailyCounts}
        artistRanking={artistRanking}
        trackRanking={trackRanking}
        hourlyDist={hourlyDist}
        />

      </div>
    </main>
  );
}