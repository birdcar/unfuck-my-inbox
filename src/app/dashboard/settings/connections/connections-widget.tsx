'use client';

import { WorkOsWidgets, Pipes } from '@workos-inc/widgets';

interface ConnectionsWidgetProps {
  accessToken: string;
}

export function ConnectionsWidget({ accessToken }: ConnectionsWidgetProps) {
  return (
    <WorkOsWidgets>
      <Pipes authToken={accessToken} />
    </WorkOsWidgets>
  );
}
