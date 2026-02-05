import { withAuth } from '@workos-inc/authkit-nextjs';
import { Card, Box, Heading, Text } from '@radix-ui/themes';
import { ConnectionsWidget } from './connections-widget';

export default async function ConnectionsPage() {
  const { accessToken } = await withAuth({ ensureSignedIn: true });

  return (
    <Card size="3">
      <Box p="4">
        <Heading size="5" mb="2">
          Connected Apps
        </Heading>
        <Text size="2" color="gray" mb="4">
          Manage your connected services and integrations.
        </Text>
        <ConnectionsWidget accessToken={accessToken} />
      </Box>
    </Card>
  );
}
