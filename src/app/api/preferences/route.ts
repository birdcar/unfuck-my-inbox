import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const { user } = await withAuth({ ensureSignedIn: true });

  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.workosUserId, user.id));

  if (!preferences) {
    // Return defaults for new users
    return NextResponse.json({
      aggressiveness: 'aggressive',
      protectedSenders: [],
      notifyOnComplete: true,
    });
  }

  return NextResponse.json({
    aggressiveness: preferences.aggressiveness,
    protectedSenders: preferences.protectedSenders,
    notifyOnComplete: preferences.notifyOnComplete,
  });
}

export async function PUT(request: Request) {
  const { user } = await withAuth({ ensureSignedIn: true });

  const body = await request.json();
  const { aggressiveness, protectedSenders, notifyOnComplete } = body;

  // Validate aggressiveness
  if (
    aggressiveness &&
    !['conservative', 'moderate', 'aggressive'].includes(aggressiveness)
  ) {
    return NextResponse.json(
      { error: 'Invalid aggressiveness value' },
      { status: 400 }
    );
  }

  // Validate protectedSenders
  if (protectedSenders && !Array.isArray(protectedSenders)) {
    return NextResponse.json(
      { error: 'protectedSenders must be an array' },
      { status: 400 }
    );
  }

  const updateData: Partial<typeof userPreferences.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (aggressiveness !== undefined) updateData.aggressiveness = aggressiveness;
  if (protectedSenders !== undefined)
    updateData.protectedSenders = protectedSenders;
  if (notifyOnComplete !== undefined)
    updateData.notifyOnComplete = notifyOnComplete;

  // Upsert preferences
  await db
    .insert(userPreferences)
    .values({
      workosUserId: user.id,
      ...updateData,
    })
    .onConflictDoUpdate({
      target: userPreferences.workosUserId,
      set: updateData,
    });

  // Return updated preferences
  const [updated] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.workosUserId, user.id));

  return NextResponse.json({
    aggressiveness: updated.aggressiveness,
    protectedSenders: updated.protectedSenders,
    notifyOnComplete: updated.notifyOnComplete,
  });
}
