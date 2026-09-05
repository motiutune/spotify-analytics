import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

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

  const codeVerifier = crypto
    .randomBytes(64)
    .toString("base64url");

  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope:
      "user-read-recently-played user-top-read",
  });

  const spotifyAuthUrl =
    `https://accounts.spotify.com/authorize?${params.toString()}`;

  const response =
    NextResponse.redirect(spotifyAuthUrl);

  response.cookies.set(
    "spotify_code_verifier",
    codeVerifier,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    }
  );

  return response;
}
