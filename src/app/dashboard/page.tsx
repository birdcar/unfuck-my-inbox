import { withAuth } from '@workos-inc/authkit-nextjs';
import { Box, Container, Heading, Text, Card } from '@radix-ui/themes';
import { GmailConnect } from '@/components/gmail-connect';

export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <Container size="3" py="6">
      <Box mb="6">
        <Heading size="8" mb="2">
          Welcome, {user.firstName ?? 'there'}
        </Heading>
        <Text size="3" color="gray">
          Connect your Gmail to start scanning for newsletters
        </Text>
      </Box>

      <Card size="3">
        <Box p="4">
          <Heading size="4" mb="4">
            Gmail Connection
          </Heading>
          <GmailConnect />
        </Box>
      </Card>
    </Container>
  );
}
