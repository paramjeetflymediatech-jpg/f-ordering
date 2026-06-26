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
    getHostOnly(process.env.NEXT_PUBLIC_APP_URL_WITH_WWW) || 'www.localhost:3000',
  ];
  const isRootHost = rootHosts.includes(hostname.toLowerCase());

  // ─── ROOT HOST: Redirect /order-online/{slug}/menu → {slug}.localhost:3000/menu ───
  if (isRootHost) {
    // Match /order-online/{slug}/menu
    const menuMatch = url.pathname.match(/^\/order-online\/([^/]+)\/menu$/);
    if (menuMatch) {
      const slug = menuMatch[1];
      const port = hostname.split(':')[1] || '3000';
      const redirectUrl = `http://${slug}.localhost:${port}/menu`;
      return NextResponse.redirect(redirectUrl);
    }

    // Match /order-online/{slug}/book
    const bookMatch = url.pathname.match(/^\/order-online\/([^/]+)\/book$/);
    if (bookMatch) {
      const slug = bookMatch[1];
      const port = hostname.split(':')[1] || '3000';
      const redirectUrl = `http://${slug}.localhost:${port}/book`;
      return NextResponse.redirect(redirectUrl);
    }

    // Match /order-online/{slug} (no trailing page)
    const slugOnly = url.pathname.match(/^\/order-online\/([^/]+)\/?$/);
    if (slugOnly) {
      const slug = slugOnly[1];
      const port = hostname.split(':')[1] || '3000';
      const redirectUrl = `http://${slug}.localhost:${port}/menu`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ─── SUBDOMAIN HOST: Rewrite /menu and /book → /order-online/{slug}/... ───
  if (!isRootHost) {
    const parts = hostname.split('.');
    const subdomain = parts[0];

    if (subdomain && subdomain !== 'www') {
      // Rewrite: {slug}.localhost:3000/menu → /order-online/{slug}/menu
      if (url.pathname === '/menu') {
        url.pathname = `/order-online/${subdomain}/menu`;
        return NextResponse.rewrite(url);
      }

      // Rewrite: {slug}.localhost:3000/book → /order-online/{slug}/book
      if (url.pathname === '/book') {
        url.pathname = `/order-online/${subdomain}/book`;
        return NextResponse.rewrite(url);
      }

      // Rewrite root path: {slug}.localhost:3000/ → /order-online/{slug}/menu
      if (url.pathname === '/') {
        url.pathname = `/order-online/${subdomain}/menu`;
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/menu',
    '/book',
    '/',
    // Catch all /order-online/* paths to redirect to subdomain
    '/order-online/:slug*/menu',
    '/order-online/:slug*/book',
    '/order-online/:slug*',
  ],
};
