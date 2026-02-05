import { withAuth } from '@workos-inc/authkit-nextjs';
import { Card, Box, Heading, Text } from '@radix-ui/themes';
import { ProfileWidget } from './profile-widget';

export default async function ProfilePage() {
  const { accessToken } = await withAuth({ ensureSignedIn: true });

  return (
    <Card size="3">
      <Box p="4">
        <Heading size="5" mb="2">
          Profile
        </Heading>
        <Text size="2" color="gray" mb="4">
          Manage your personal information.
        </Text>
        <ProfileWidget accessToken={accessToken} />
      </Box>
    </Card>
  );
}
