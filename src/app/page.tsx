import { Box, Container, Heading, Text, Button, Flex, Card } from '@radix-ui/themes';
import { EnvelopeClosedIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function Home() {
  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container size="2">
        <Flex direction="column" align="center" gap="6">
          <Flex align="center" gap="3">
            <EnvelopeClosedIcon width={40} height={40} />
            <Heading size="9">Unfuck My Inbox</Heading>
          </Flex>

          <Text size="5" color="gray" align="center">
            Reclaim your inbox from newsletter clutter.
            <br />
            One scan, one click, done.
          </Text>

          <Card size="3" style={{ width: '100%', maxWidth: 400 }}>
            <Flex direction="column" gap="4" align="center" p="4">
              <Text size="3" color="gray">
                Connect your Gmail and let us find all those newsletters you
                meant to unsubscribe from.
              </Text>

              <Button asChild size="3">
                <Link href="/login">Get Started</Link>
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Box>
  );
}
