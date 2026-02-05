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
      return NextResponse.json(
        { error: 'token_retrieval_failed', missingScopes: [] },
        { status: 401 }
      );
    }

    const data: PipesTokenResponse = await response.json();

    if (data.error || !data.access_token) {
      return NextResponse.json(
        { error: data.error ?? 'no_token', missingScopes: [] },
        { status: 401 }
      );
    }

    return NextResponse.json({
      accessToken: data.access_token.token,
      expiresAt: data.access_token.expires_at,
    });
  } catch {
    return NextResponse.json(
      { error: 'token_retrieval_failed', missingScopes: [] },
      { status: 401 }
    );
  }
}
