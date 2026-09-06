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
  let query = supabase
    .from("spotify_history")
    .select(
      "track_id, track_name, artist_name, album_name, album_image_url, played_at"
    )
    .order("played_at", {
      ascending: true,
    });

  if (period !== "all") {
    const days = Number(period);

    const startDate = new Date();

    startDate.setDate(
      startDate.getDate() - days
    );

    query = query.gte(
      "played_at",
      startDate.toISOString()
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as HistoryRow[];
}