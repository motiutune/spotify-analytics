import {
  getDailyPlayCounts,
  getArtistRanking,
  getHourlyDistribution,
} from "@/lib/analytics";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function AnalyticsPage() {
  const [dailyCounts, artistRanking, hourlyDist] = await Promise.all([
    getDailyPlayCounts(),
    getArtistRanking(),
    getHourlyDistribution(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-5xl">

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">分析</h1>

          <a 
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            ← Dashboardに戻る
          </a>
        </div>

        <AnalyticsCharts
          dailyCounts={dailyCounts}
          artistRanking={artistRanking}
          hourlyDist={hourlyDist}
        />

      </div>
    </main>
  );
}