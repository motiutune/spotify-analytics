
import { supabase } from "@/lib/supabase";

export type HistoryRow = {
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_image_url: string | null;
  played_at: string;
};

export type Period = "7" | "30" | "all";

export async function getHistoryByPeriod(
  period: Period
): Promise<HistoryRow[]> {
  const pageSize = 1000;
  const allHistory: HistoryRow[] = [];

  let offset = 0;

  let startDate: string | null = null;

  if (period !== "all") {
    const date = new Date();

    date.setDate(
      date.getDate() - Number(period)
    );

    startDate = date.toISOString();
  }

  while (true) {
    let query = supabase
      .from("spotify_history")
      .select(
        "track_id, track_name, artist_name, album_name, album_image_url, played_at"
      )
      .order("played_at", {
        ascending: true,
      })
      .order("track_id", {
        ascending: true,
      })
      .range(offset, offset + pageSize - 1);

    if (startDate) {
      query = query.gte(
        "played_at",
        startDate
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as HistoryRow[];

    allHistory.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allHistory;
}
