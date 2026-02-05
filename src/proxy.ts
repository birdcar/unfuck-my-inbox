import { authkitMiddleware } from '@workos-inc/authkit-nextjs';
import { NextFetchEvent, NextRequest } from 'next/server';

const authkit = authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/', '/login', '/auth/v1/callback'],
  },
  debug: true,
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  console.log('[Proxy] Running on:', request.nextUrl.pathname);
  return authkit(request, event);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
