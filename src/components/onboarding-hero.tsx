'use client';

import { Box, Card, Heading, Text, Button, Flex } from '@radix-ui/themes';
import { EnvelopeClosedIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

interface OnboardingHeroProps {
  firstName?: string | null;
}

export function OnboardingHero({ firstName }: OnboardingHeroProps) {
  return (
    <Card size="4">
      <Flex direction="column" align="center" gap="4" py="6">
        <Box
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--accent-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EnvelopeClosedIcon width={32} height={32} color="var(--accent-9)" />
        </Box>

        <Box style={{ textAlign: 'center' }}>
          <Heading size="6" mb="2">
            Welcome{firstName ? `, ${firstName}` : ''}!
          </Heading>
          <Text size="3" color="gray" style={{ maxWidth: 400 }}>
            Connect your Gmail account to start scanning your inbox for
            newsletters and take back control of your email.
          </Text>
        </Box>

        <Button size="3" asChild>
          <Link href="/dashboard/settings/connections">
            Get Started
          </Link>
        </Button>
      </Flex>
    </Card>
  );
}
