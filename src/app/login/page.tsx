import { getSignInUrl, getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { Box, Container, Heading, Text, Button, Flex, Card } from '@radix-ui/themes';
import { EnvelopeClosedIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default async function LoginPage() {
  const signInUrl = await getSignInUrl();
  const signUpUrl = await getSignUpUrl();

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container size="1">
        <Flex direction="column" align="center" gap="6">
          <Flex align="center" gap="2">
            <EnvelopeClosedIcon width={24} height={24} />
            <Heading size="6">Unfuck My Inbox</Heading>
          </Flex>

          <Card size="3" style={{ width: '100%', maxWidth: 400 }}>
            <Flex direction="column" gap="4" p="4">
              <Heading size="5" align="center">
                Welcome
              </Heading>
              <Text size="2" color="gray" align="center">
                Sign in to manage your inbox subscriptions
              </Text>

              <Flex direction="column" gap="3" mt="2">
                <Button asChild size="3">
                  <Link href={signInUrl}>Sign In</Link>
                </Button>
                <Button asChild size="3" variant="outline">
                  <Link href={signUpUrl}>Create Account</Link>
                </Button>
              </Flex>
            </Flex>
          </Card>

          <Text size="1" color="gray">
            <Link href="/">Back to home</Link>
          </Text>
        </Flex>
      </Container>
    </Box>
  );
}
