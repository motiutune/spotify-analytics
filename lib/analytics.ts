import { supabase } from "@/lib/supabase";

export type DailyPlayCount = {
  play_date: string;
  play_count: number;
};

export type ArtistRanking = {
  artist_name: string;
  play_count: number;
  last_played_at: string;
};

export type HourlyDistribution = {
  hour: number;
  play_count: number;
};

export async function getDailyPlayCounts(limit = 30) {
  const { data, error } = await supabase
    .from("daily_play_counts")
    .select("*")
    .limit(limit);

  if (error) throw error;
  return data as DailyPlayCount[];
}

export async function getArtistRanking(limit = 10) {
  const { data, error } = await supabase
    .from("artist_ranking")
    .select("*")
    .limit(limit);

  if (error) throw error;
  return data as ArtistRanking[];
}

export async function getHourlyDistribution() {
  const { data, error } = await supabase
    .from("hourly_distribution")
    .select("*");

  if (error) throw error;
  return data as HourlyDistribution[];
}