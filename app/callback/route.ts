import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  request: NextRequest
) {
  const code =
    request.nextUrl.searchParams.get("code");

  if (!code) {
    return new NextResponse(
      "Authorization code is missing.",
      {
        status: 400,
      }
    );
  }

  const codeVerifier =
    request.cookies.get(
      "spotify_code_verifier"
    )?.value;

  if (!codeVerifier) {
    return new NextResponse(
      "Code verifier is missing.",
      {
        status: 400,
      }
    );
  }

  const clientId =
    process.env.SPOTIFY_CLIENT_ID;

  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId) {
    return new NextResponse(
      "Spotify Client ID is not configured.",
      {
        status: 500,
      }
    );
  }

  if (!redirectUri) {
    return new NextResponse(
      "Spotify Redirect URI is not configured.",
      {
        status: 500,
      }
    );
  }

  if (!appUrl) {
    return new NextResponse(
      "App URL is not configured.",
      {
        status: 500,
      }
    );
  }

  const tokenResponse = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type:
          "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    }
  );

  if (!tokenResponse.ok) {
    const errorText =
      await tokenResponse.text();

    return new NextResponse(
      `Token exchange failed: ${errorText}`,
      {
        status: 400,
      }
    );
  }

  const tokenData =
    await tokenResponse.json();

  const accessToken =
    tokenData.access_token;

  const refreshToken =
    tokenData.refresh_token;

  if (!accessToken || !refreshToken) {
    return new NextResponse(
      "Spotify tokens were not returned.",
      {
        status: 400,
      }
    );
  }

  const profileResponse = await fetch(
    "https://api.spotify.com/v1/me",
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  );

  if (!profileResponse.ok) {
    const errorText =
      await profileResponse.text();

    return new NextResponse(
      `Profile request failed: ${errorText}`,
      {
        status: 400,
      }
    );
  }

  const profile =
    await profileResponse.json();

  const expiresAt = new Date(
    Date.now() +
      tokenData.expires_in * 1000
  ).toISOString();

  const { error: tokenSaveError } =
    await supabaseAdmin
      .from("spotify_tokens")
      .upsert(
        {
          spotify_user_id:
            profile.id,
          access_token:
            accessToken,
          refresh_token:
            refreshToken,
          expires_at:
            expiresAt,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "spotify_user_id",
        }
      );

  if (tokenSaveError) {
    console.error(
      "Spotify token保存エラー:",
      tokenSaveError
    );

    return new NextResponse(
      "Failed to save Spotify tokens.",
      {
        status: 500,
      }
    );
  }

  const response =
    NextResponse.redirect(
      `${appUrl}/dashboard`
    );

  response.cookies.set(
    "spotify_access_token",
    accessToken,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        tokenData.expires_in,
    }
  );

  return response;
}