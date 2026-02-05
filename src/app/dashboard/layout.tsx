import { Box } from '@radix-ui/themes';
import { Header } from '@/components/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box style={{ minHeight: '100vh' }}>
      <Header />
      {children}
    </Box>
  );
}
