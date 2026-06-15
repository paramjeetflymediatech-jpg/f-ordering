import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Exclude static assets and API routes
  const excludePaths = [
    '/api',
    '/_next',
    '/static',
    '/favicon.ico',
    '/logo',
    '/next.svg',
    '/vercel.svg',
  ];
  if (excludePaths.some((path) => url.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Identify root hosts that should not be parsed for subdomains
  const rootHosts = ['localhost:3000', 'twirll.com', 'www.twirll.com'];
  const isRootHost = rootHosts.includes(hostname.toLowerCase());

  if (!isRootHost) {
    // Extract the subdomain (first part of the host)
    const parts = hostname.split('.');
    const subdomain = parts[0];

    if (subdomain && subdomain !== 'www') {
      // Rewrite customer order page
      if (url.pathname === '/order-online/menu') {
        url.pathname = `/order-online/${subdomain}/menu`;
        return NextResponse.rewrite(url);
      }
      
      // Rewrite table booking page
      if (url.pathname === '/order-online/book') {
        url.pathname = `/order-online/${subdomain}/book`;
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/order-online/menu',
    '/order-online/book',
  ],
};
