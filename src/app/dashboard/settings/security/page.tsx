import { withAuth } from '@workos-inc/authkit-nextjs';
import { Card, Box, Heading, Text } from '@radix-ui/themes';
import { SecurityWidget } from './security-widget';

export default async function SecurityPage() {
  const { accessToken } = await withAuth({ ensureSignedIn: true });

  return (
    <Card size="3">
      <Box p="4">
        <Heading size="5" mb="2">
          Security
        </Heading>
        <Text size="2" color="gray" mb="4">
          Manage your password and security settings.
        </Text>
        <SecurityWidget accessToken={accessToken} />
      </Box>
    </Card>
  );
}
