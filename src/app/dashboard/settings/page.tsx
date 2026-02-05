import { withAuth } from '@workos-inc/authkit-nextjs';
import { Box, Container, Heading, Card } from '@radix-ui/themes';
import { SettingsWidgets } from './settings-widgets';

export default async function SettingsPage() {
  const { accessToken, sessionId } = await withAuth({ ensureSignedIn: true });

  return (
    <Container size="2" py="6">
      <Heading size="8" mb="6">
        Account Settings
      </Heading>

      <Card size="3">
        <Box p="4">
          <SettingsWidgets accessToken={accessToken} sessionId={sessionId} />
        </Box>
      </Card>
    </Container>
  );
}
