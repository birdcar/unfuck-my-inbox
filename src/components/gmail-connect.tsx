'use client';

import { useState, useEffect } from 'react';
import { Button, Flex, Text, Callout, Box } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { Pipes, WorkOsWidgets } from '@workos-inc/widgets';
import { useAccessToken } from '@workos-inc/authkit-nextjs/components';

export function GmailConnect() {
  const { getAccessToken } = useAccessToken();

  const getToken = async (): Promise<string> => {
    const token = await getAccessToken();
    if (!token) throw new Error('No access token available');
    return token;
  };
  const [status, setStatus] = useState<{
    isConnected: boolean;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWidget, setShowWidget] = useState(false);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/gmail/status');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ isConnected: false, error: 'Failed to check status' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Re-check status when widget is closed
  useEffect(() => {
    if (!showWidget) {
      checkStatus();
    }
  }, [showWidget]);

  if (loading) {
    return <Text color="gray">Checking connection...</Text>;
  }

  if (status?.isConnected) {
    return (
      <Callout.Root color="green">
        <Callout.Icon>
          <CheckCircledIcon />
        </Callout.Icon>
        <Callout.Text>Gmail connected successfully</Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <Flex direction="column" gap="3">
      {status?.error && status.error !== 'not_connected' && (
        <Callout.Root color="red">
          <Callout.Icon>
            <CrossCircledIcon />
          </Callout.Icon>
          <Callout.Text>Connection error: {status.error}</Callout.Text>
        </Callout.Root>
      )}

      {!status?.isConnected && !showWidget && (
        <Box>
          <Text size="2" color="gray" mb="3">
            Connect your Google account to scan your inbox for newsletters.
          </Text>
          <Button size="3" onClick={() => setShowWidget(true)}>
            Connect Gmail
          </Button>
        </Box>
      )}

      {showWidget && (
        <Box>
          <WorkOsWidgets>
            <Pipes authToken={getToken} />
          </WorkOsWidgets>
          <Button
            variant="soft"
            color="gray"
            size="2"
            mt="3"
            onClick={() => setShowWidget(false)}
          >
            Done
          </Button>
        </Box>
      )}
    </Flex>
  );
}
