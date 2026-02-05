'use client';

import { WorkOsWidgets, UserProfile } from '@workos-inc/widgets';

interface ProfileWidgetProps {
  accessToken: string;
}

export function ProfileWidget({ accessToken }: ProfileWidgetProps) {
  return (
    <WorkOsWidgets>
      <UserProfile authToken={accessToken} />
    </WorkOsWidgets>
  );
}
