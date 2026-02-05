'use client';

import { Box, Heading, Separator } from '@radix-ui/themes';
import {
  WorkOsWidgets,
  UserProfile,
  UserSecurity,
  UserSessions,
  Pipes,
} from '@workos-inc/widgets';

interface SettingsWidgetsProps {
  accessToken: string;
  sessionId: string;
}

export function SettingsWidgets({
  accessToken,
  sessionId,
}: SettingsWidgetsProps) {
  return (
    <WorkOsWidgets>
      <Box mb="6">
        <Heading size="5" mb="3">
          Profile
        </Heading>
        <UserProfile authToken={accessToken} />
      </Box>

      <Separator size="4" my="6" />

      <Box mb="6">
        <Heading size="5" mb="3">
          Connected Apps
        </Heading>
        <Pipes authToken={accessToken} />
      </Box>

      <Separator size="4" my="6" />

      <Box mb="6">
        <Heading size="5" mb="3">
          Security
        </Heading>
        <UserSecurity authToken={accessToken} />
      </Box>

      <Separator size="4" my="6" />

      <Box>
        <Heading size="5" mb="3">
          Active Sessions
        </Heading>
        <UserSessions authToken={accessToken} currentSessionId={sessionId} />
      </Box>
    </WorkOsWidgets>
  );
}
