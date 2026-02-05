import { withAuth } from '@workos-inc/authkit-nextjs';
import { Box, Container, Heading, Text } from '@radix-ui/themes';
import { OnboardingHero } from '@/components/onboarding-hero';
import { checkGmailConnection } from '@/lib/gmail';

export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  const isGmailConnected = await checkGmailConnection(user.id);

  if (!isGmailConnected) {
    return (
      <Container size="2" py="9">
        <OnboardingHero firstName={user.firstName} />
      </Container>
    );
  }

  return (
    <Container size="3" py="6">
      <Box mb="6">
        <Heading size="8" mb="2">
          Welcome back, {user.firstName ?? 'there'}
        </Heading>
        <Text size="3" color="gray">
          Your inbox is being monitored for newsletters
        </Text>
      </Box>

      {/* TODO: Show newsletter scan results here */}
    </Container>
  );
}
