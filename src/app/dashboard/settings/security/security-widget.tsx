'use client';

import { WorkOsWidgets, UserSecurity } from '@workos-inc/widgets';

interface SecurityWidgetProps {
  accessToken: string;
}

export function SecurityWidget({ accessToken }: SecurityWidgetProps) {
  return (
    <WorkOsWidgets>
      <UserSecurity authToken={accessToken} />
    </WorkOsWidgets>
  );
}
