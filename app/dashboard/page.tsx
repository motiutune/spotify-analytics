import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export default async function Dashboard() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            My Spotify Analytics
          </h1>

          <p className="text-zinc-400 mb-8">
            Spotifyにログインしてください。
          </p>

          <a
            href="/api/login"
            className="inline-flex items-center rounded-full bg-green-500 px-6 py-3 font-semibold text-black transition hover:bg-green-400"
          >
            Spotifyでログイン
          </a>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Spotifyプロフィール
  // -----------------------------

  const profileResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p>Spotifyのプロフィールを取得できませんでした。</p>
      </main>
    );
  }

  const profile = await profileResponse.json();

  // -----------------------------
  // 最近聴いた曲
  // -----------------------------

  const recentResponse = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=10",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!recentResponse.ok) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p>最近聴いた曲を取得できませんでした。</p>
      </main>
    );
  }

  const recentData = await recentResponse.json();

  // -----------------------------
  // Spotify履歴をDB保存用データに変換
  // -----------------------------

  const history = recentData.items.map((item: any) => ({
    track_id: item.track.id,
    track_name: item.track.name,
    artist_name: item.track.artists
      .map((artist: any) => artist.name)
      .join(", "),
    album_name: item.track.album.name,
    album_image_url: item.track.album.images[0]?.url ?? null,
    played_at: item.played_at,
  }));

  // -----------------------------
  // Supabaseから既存履歴を取得
  // -----------------------------

  const { data: existingHistory, error: existingError } = await supabase
    .from("spotify_history")
    .select("track_id, played_at");

  if (existingError) {
    console.error("既存履歴取得エラー:", existingError);
  }

  // -----------------------------
  // 既存データと比較
  // -----------------------------

  const existingKeys = new Set(
    (existingHistory ?? []).map(
      (item) => `${item.track_id}_${item.played_at}`
    )
  );

  const newHistory = history.filter(
    (item: any) =>
      !existingKeys.has(`${item.track_id}_${item.played_at}`)
  );

  // -----------------------------
  // 新しい履歴だけSupabaseへ保存
  // -----------------------------

  if (newHistory.length > 0) {
    const { error: insertError } = await supabase
      .from("spotify_history")
      .insert(newHistory);

    if (insertError) {
      console.error("Supabase保存エラー:", insertError);
    } else {
      console.log(`${newHistory.length}件の新しい履歴を保存しました`);
    }
  }

  // -----------------------------
  // Supabaseから保存済み履歴を取得
  // -----------------------------

  const { data: historyData, error: historyError } = await supabase
    .from("spotify_history")
    .select("*")
    .order("played_at", {
      ascending: false,
    });

  if (historyError) {
    console.error("履歴取得エラー:", historyError);
  }

  const totalPlays = historyData?.length ?? 0;

  // -----------------------------
  // Top Artists
  // -----------------------------

  const topArtistsResponse = await fetch(
    "https://api.spotify.com/v1/me/top/artists?limit=5",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!topArtistsResponse.ok) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p>Top Artistsを取得できませんでした。</p>
      </main>
    );
  }

  const topArtistsData = await topArtistsResponse.json();

  // -----------------------------
  // Top Tracks
  // -----------------------------

  const topTracksResponse = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?limit=5",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!topTracksResponse.ok) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p>Top Tracksを取得できませんでした。</p>
      </main>
    );
  }

  const topTracksData = await topTracksResponse.json();

  // -----------------------------
  // Dashboard
  // -----------------------------

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-green-400">
              MUSIC ANALYTICS
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              My Spotify Analytics
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/analytics"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              分析を見る
            </a>

            <a
              href={profile.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Spotifyプロフィール
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Profile */}
        <section className="mb-10">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 sm:flex-row sm:items-center">
            {profile.images?.[1]?.url && (
              <img
                src={profile.images[1].url}
                alt={profile.display_name}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/10"
              />
            )}

            <div>
              <p className="text-sm text-zinc-500">Spotify User</p>
              <h2 className="mt-1 text-3xl font-bold">
                {profile.display_name}
              </h2>
              <p className="mt-2 text-zinc-400">
                フォロワー {profile.followers?.total ?? "-"}人
              </p>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Plays */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-zinc-500">TOTAL PLAYS</p>
            <p className="mt-2 text-4xl font-bold">{totalPlays}</p>
            <p className="mt-1 text-sm text-zinc-500">
              保存されている再生履歴
            </p>
          </div>

          {/* Recent */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-zinc-500">RECENT</p>
            <p className="mt-2 text-4xl font-bold">
              {recentData.items.length}
            </p>
            <p className="mt-1 text-sm text-zinc-500">今回取得した曲</p>
          </div>

          {/* Top Artist */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-zinc-500">TOP ARTIST</p>
            <p className="mt-2 truncate text-2xl font-bold">
              {topArtistsData.items[0]?.name ?? "-"}
            </p>
          </div>

          {/* Top Track */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-zinc-500">TOP TRACK</p>
            <p className="mt-2 truncate text-2xl font-bold">
              {topTracksData.items[0]?.name ?? "-"}
            </p>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recently Played */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-green-400">
                RECENT ACTIVITY
              </p>
              <h2 className="mt-1 text-2xl font-bold">最近聴いた曲</h2>
            </div>

            <div className="space-y-3">
              {recentData.items.map((item: any, index: number) => (
                <a
                  key={`${item.track.id}-${index}`}
                  href={item.track.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl p-3 transition hover:bg-white/[0.06]"
                >
                  <img
                    src={item.track.album.images[2]?.url}
                    alt={item.track.album.name}
                    className="h-14 w-14 rounded-xl object-cover shadow-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white group-hover:text-green-400">
                      {item.track.name}
                    </p>
                    <p className="truncate text-sm text-zinc-400">
                      {item.track.artists
                        .map((artist: any) => artist.name)
                        .join(", ")}
                    </p>
                  </div>

                  <span className="hidden text-xs text-zinc-500 sm:block">
                    {new Date(item.played_at).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* Top Artists */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-green-400">
                YOUR FAVORITES
              </p>
              <h2 className="mt-1 text-2xl font-bold">Top Artists</h2>
            </div>

            <div className="space-y-4">
              {topArtistsData.items.map((artist: any, index: number) => (
                <a
                  key={artist.id}
                  href={artist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl p-3 transition hover:bg-white/[0.06]"
                >
                  <span className="w-6 text-center text-sm font-bold text-zinc-500">
                    {index + 1}
                  </span>

                  <img
                    src={artist.images?.[2]?.url}
                    alt={artist.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />

                  <p className="font-medium group-hover:text-green-400">
                    {artist.name}
                  </p>
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Top Tracks */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6">
            <p className="text-sm font-medium text-green-400">
              MOST LISTENED
            </p>
            <h2 className="mt-1 text-2xl font-bold">Top Tracks</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {topTracksData.items.map((track: any, index: number) => (
              <a
                key={track.id}
                href={track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl p-3 transition hover:bg-white/[0.06]"
              >
                <span className="w-6 text-center text-sm font-bold text-zinc-500">
                  {index + 1}
                </span>

                <img
                  src={track.album.images[2]?.url}
                  alt={track.album.name}
                  className="h-16 w-16 rounded-xl object-cover shadow-lg"
                />

                <div className="min-w-0">
                  <p className="truncate font-medium group-hover:text-green-400">
                    {track.name}
                  </p>
                  <p className="truncate text-sm text-zinc-400">
                    {track.artists
                      .map((artist: any) => artist.name)
                      .join(", ")}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center text-sm text-zinc-600">
          My Spotify Analytics
        </footer>
      </div>
    </main>
  );
}