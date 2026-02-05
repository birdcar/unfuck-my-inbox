'use client';

import { Box, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Link2Icon,
  PersonIcon,
  LockClosedIcon,
  DesktopIcon,
} from '@radix-ui/react-icons';

const navItems = [
  {
    href: '/dashboard/settings/connections',
    label: 'Connections',
    icon: Link2Icon,
  },
  {
    href: '/dashboard/settings/profile',
    label: 'Profile',
    icon: PersonIcon,
  },
  {
    href: '/dashboard/settings/security',
    label: 'Security',
    icon: LockClosedIcon,
  },
  {
    href: '/dashboard/settings/sessions',
    label: 'Sessions',
    icon: DesktopIcon,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <Box
      style={{
        width: 200,
        flexShrink: 0,
      }}
    >
      <nav>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none' }}
            >
              <Box
                py="2"
                px="3"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  borderRadius: 'var(--radius-2)',
                  backgroundColor: isActive
                    ? 'var(--accent-3)'
                    : 'transparent',
                  color: isActive ? 'var(--accent-11)' : 'var(--gray-11)',
                  transition: 'background-color 0.1s',
                }}
              >
                <Icon />
                <Text size="2" weight={isActive ? 'medium' : 'regular'}>
                  {item.label}
                </Text>
              </Box>
            </Link>
          );
        })}
      </nav>
    </Box>
  );
}
