import { withAuth } from '@workos-inc/authkit-nextjs';
import { Card, Box, Heading, Text } from '@radix-ui/themes';
import { SessionsWidget } from './sessions-widget';

export default async function SessionsPage() {
  const { accessToken, sessionId } = await withAuth({ ensureSignedIn: true });

  return (
    <Card size="3">
      <Box p="4">
        <Heading size="5" mb="2">
          Active Sessions
        </Heading>
        <Text size="2" color="gray" mb="4">
          View and manage your active sessions across devices.
        </Text>
        <SessionsWidget accessToken={accessToken} sessionId={sessionId} />
      </Box>
    </Card>
  );
}
