import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

const WORKOS_API_KEY = process.env.WORKOS_API_KEY!;

interface PipesTokenResponse {
  active: boolean;
  access_token?: { token: string; expires_at: string };
  error?: string;
}

export async function GET() {
  const { user } = await withAuth({ ensureSignedIn: true });

  try {
    // Check if user has a valid Google connection via Pipes
    const response = await fetch(
      'https://api.workos.com/data-integrations/google/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WORKOS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        isConnected: false,
        error: 'not_connected',
      });
    }

    const data: PipesTokenResponse = await response.json();

    return NextResponse.json({
      isConnected: data.active && !!data.access_token,
      error: data.error ?? null,
    });
  } catch {
    return NextResponse.json({
      isConnected: false,
      error: 'not_connected',
    });
  }
}
