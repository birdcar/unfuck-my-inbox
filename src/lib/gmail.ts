const WORKOS_API_KEY = process.env.WORKOS_API_KEY!;

export async function checkGmailConnection(userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      'https://api.workos.com/data-integrations/google/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WORKOS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.active && !!data.access_token;
  } catch {
    return false;
  }
}
