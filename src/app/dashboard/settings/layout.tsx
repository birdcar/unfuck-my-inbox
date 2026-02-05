import { Container, Heading, Box } from '@radix-ui/themes';
import { SettingsNav } from './settings-nav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container size="3" py="6">
      <Heading size="8" mb="6">
        Settings
      </Heading>
      <Box style={{ display: 'flex', gap: 'var(--space-6)' }}>
        <SettingsNav />
        <Box style={{ flex: 1 }}>{children}</Box>
      </Box>
    </Container>
  );
}
