import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Bypass proxy rewrites for raw IP addresses (e.g. 10.0.2.2 or local LAN IPs during testing)
  const hostNameOnly = hostname.split(':')[0];
  const isIPAddress = /^[0-9.]+$/.test(hostNameOnly);
  if (isIPAddress) {
    return NextResponse.next();
  }

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
    return urlStr.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].toLowerCase();
  };

  // Identify root hosts that should not be parsed for subdomains
  const rootHosts = [
    getHostOnly(process.env.NEXT_PUBLIC_APP_URL) || 'localhost',
    getHostOnly(process.env.NEXT_PUBLIC_APP_URL_WITH_WWW) || 'www.localhost',
    'fly-pos.com',
    'www.fly-pos.com',
  ];
  const isRootHost = rootHosts.includes(hostname.split(':')[0].toLowerCase());

  // ─── ROOT HOST: Redirect /order-online/{slug}/menu → {slug}.localhost:3000/menu ───
  if (isRootHost) {
    const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

    // Match /order-online/{slug}/menu
    const menuMatch = url.pathname.match(/^\/order-online\/([^/]+)\/menu$/);
    if (menuMatch) {
      const slug = menuMatch[1];
      let redirectUrl;
      if (isLocal) {
        const port = hostname.split(':')[1] || '3000';
        redirectUrl = `http://${slug}.localhost:${port}/menu`;
      } else {
        redirectUrl = `https://${slug}.fly-pos.com/menu`;
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Match /order-online/{slug}/book
    const bookMatch = url.pathname.match(/^\/order-online\/([^/]+)\/book$/);
    if (bookMatch) {
      const slug = bookMatch[1];
      let redirectUrl;
      if (isLocal) {
        const port = hostname.split(':')[1] || '3000';
        redirectUrl = `http://${slug}.localhost:${port}/book`;
      } else {
        redirectUrl = `https://${slug}.fly-pos.com/book`;
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Match /order-online/{slug} (no trailing page)
    const slugOnly = url.pathname.match(/^\/order-online\/([^/]+)\/?$/);
    if (slugOnly) {
      const slug = slugOnly[1];
      let redirectUrl;
      if (isLocal) {
        const port = hostname.split(':')[1] || '3000';
        redirectUrl = `http://${slug}.localhost:${port}/menu`;
      } else {
        redirectUrl = `https://${slug}.fly-pos.com/menu`;
      }
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
