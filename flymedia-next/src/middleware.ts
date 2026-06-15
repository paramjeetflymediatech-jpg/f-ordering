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

  // Helper to clean protocol and port/path from env variables if needed
  const getHostOnly = (urlStr: string | undefined) => {
    if (!urlStr) return '';
    return urlStr.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  };

  // Identify root hosts that should not be parsed for subdomains
  const rootHosts = [
    getHostOnly(process.env.NEXT_PUBLIC_APP_URL) || 'localhost:3000',
    getHostOnly(process.env.NEXT_PUBLIC_APP_URL_WITH_WWW) || 'www.localhost:3000'
  ];
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
