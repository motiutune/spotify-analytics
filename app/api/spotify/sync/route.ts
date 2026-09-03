import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (
    !cronSecret ||
    authorization !== `Bearer ${cronSecret}`
  ) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  // Spotifyトークン取得
  const { data: tokenData, error: tokenError } =
    await supabaseAdmin
      .from("spotify_tokens")
      .select(
        "spotify_user_id, access_token, refresh_token, expires_at"
      )
      .limit(1)
      .single();

  if (tokenError || !tokenData) {
    console.error(
      "Spotifyトークン取得エラー:",
      tokenError
    );

    return new NextResponse(
      "Spotify token not found.",
      {
        status: 500,
      }
    );
  }

  let accessToken = tokenData.access_token;
  let refreshToken = tokenData.refresh_token;

  const expiresAt = new Date(
    tokenData.expires_at
  ).getTime();

  const now = Date.now();

  // 5分以内に期限切れなら更新
  if (expiresAt - now < 5 * 60 * 1000) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;

    if (!clientId) {
      return new NextResponse(
        "Spotify Client ID is not configured.",
        {
          status: 500,
        }
      );
    }

    const refreshResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
        cache: "no-store",
      }
    );

    if (!refreshResponse.ok) {
      const errorText =
        await refreshResponse.text();

      console.error(
        "Spotifyトークン更新エラー:",
        errorText
      );

      return new NextResponse(
        "Failed to refresh Spotify token.",
        {
          status: 500,
        }
      );
    }

    const refreshedToken =
      await refreshResponse.json();

    accessToken = refreshedToken.access_token;

    if (refreshedToken.refresh_token) {
      refreshToken =
        refreshedToken.refresh_token;
    }

    const newExpiresAt = new Date(
      Date.now() +
        refreshedToken.expires_in * 1000
    ).toISOString();

    const { error: updateTokenError } =
      await supabaseAdmin
        .from("spotify_tokens")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: newExpiresAt,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "spotify_user_id",
          tokenData.spotify_user_id
        );

    if (updateTokenError) {
      console.error(
        "Spotifyトークン更新保存エラー:",
        updateTokenError
      );

      return new NextResponse(
        "Failed to save refreshed token.",
        {
          status: 500,
        }
      );
    }

    console.log(
      "Spotify access tokenを更新しました"
    );
  }

  // 最近聴いた曲を最大50件取得
  const recentResponse = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!recentResponse.ok) {
    const errorText =
      await recentResponse.text();

    console.error(
      "Recently Played取得エラー:",
      errorText
    );

    return new NextResponse(
      "Failed to fetch recently played tracks.",
      {
        status: 500,
      }
    );
  }

  const recentData =
    await recentResponse.json();

  const history = recentData.items.map(
    (item: any) => ({
      track_id: item.track.id,
      track_name: item.track.name,
      artist_name: item.track.artists
        .map(
          (artist: any) => artist.name
        )
        .join(", "),
      album_name: item.track.album.name,
      album_image_url:
        item.track.album.images[0]?.url ??
        null,
      played_at: item.played_at,
    })
  );

  if (history.length === 0) {
    return NextResponse.json({
      success: true,
      fetched: 0,
      uniqueFetched: 0,
      saved: 0,
    });
  }

  // 今回取得した50件内で重複除去
  const uniqueHistory = Array.from(
    new Map(
      history.map((item: any) => [
        `${item.track_id}_${item.played_at}`,
        item,
      ])
    ).values()
  );

  // DB側の UNIQUE(track_id, played_at) に
  // 重複判定を任せる
  const {
    data: insertedRows,
    error: insertError,
  } = await supabaseAdmin
    .from("spotify_history")
    .upsert(uniqueHistory, {
      onConflict: "track_id,played_at",
      ignoreDuplicates: true,
    })
    .select("track_id, played_at");

  if (insertError) {
    console.error(
      "Supabase保存エラー:",
      insertError
    );

    return NextResponse.json(
      {
        success: false,
        error: insertError.message,
      },
      {
        status: 500,
      }
    );
  }

  const savedCount =
    insertedRows?.length ?? 0;

  console.log(
    `Spotify同期完了: ${savedCount}件追加`
  );

  return NextResponse.json({
    success: true,
    fetched: history.length,
    uniqueFetched: uniqueHistory.length,
    saved: savedCount,
  });
}
