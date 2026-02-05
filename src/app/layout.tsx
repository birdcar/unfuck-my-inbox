import type { Metadata } from 'next';
import '@radix-ui/themes/styles.css';
import '@workos-inc/widgets/styles.css';
import { Theme } from '@radix-ui/themes';
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Unfuck My Inbox',
  description: 'Reclaim your inbox from newsletter clutter',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider>
          <Providers>
            <Theme accentColor="blue" grayColor="slate" radius="medium">
              {children}
            </Theme>
          </Providers>
        </AuthKitProvider>
      </body>
    </html>
  );
}
