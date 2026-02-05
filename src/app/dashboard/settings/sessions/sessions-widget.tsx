'use client';

import { WorkOsWidgets, UserSessions } from '@workos-inc/widgets';

interface SessionsWidgetProps {
  accessToken: string;
  sessionId: string;
}

export function SessionsWidget({ accessToken, sessionId }: SessionsWidgetProps) {
  return (
    <WorkOsWidgets>
      <UserSessions authToken={accessToken} currentSessionId={sessionId} />
    </WorkOsWidgets>
  );
}
