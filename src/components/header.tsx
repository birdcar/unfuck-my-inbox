import { withAuth, signOut } from '@workos-inc/authkit-nextjs';
import { Box, Flex, Text, Button, Avatar } from '@radix-ui/themes';
import {
  EnvelopeClosedIcon,
  GearIcon,
  ExitIcon,
} from '@radix-ui/react-icons';
import Link from 'next/link';

export async function Header() {
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <Box
      style={{
        borderBottom: '1px solid var(--gray-a5)',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <Flex
        justify="between"
        align="center"
        py="3"
        px="4"
        style={{ maxWidth: 1200, margin: '0 auto' }}
      >
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Flex align="center" gap="2">
            <EnvelopeClosedIcon width={20} height={20} />
            <Text size="4" weight="bold">
              Unfuck My Inbox
            </Text>
          </Flex>
        </Link>

        <Flex align="center" gap="4">
          <Button asChild variant="ghost" size="2">
            <Link href="/dashboard/settings">
              <GearIcon />
              Settings
            </Link>
          </Button>

          <Flex align="center" gap="2">
            <Avatar
              size="2"
              fallback={user.firstName?.[0] ?? user.email[0]}
              radius="full"
            />
            <Text size="2">{user.email}</Text>
          </Flex>

          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <Button type="submit" variant="soft" color="gray" size="2">
              <ExitIcon />
              Sign Out
            </Button>
          </form>
        </Flex>
      </Flex>
    </Box>
  );
}
