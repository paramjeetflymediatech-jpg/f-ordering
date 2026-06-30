import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { NextRequest } from 'next/server';

async function handler(request: NextRequest, context: any) {
  const host = request.headers.get('host') || 'fly-pos.com';
  const originalProto = request.headers.get('x-forwarded-proto') || 'not-set';
  let proto = 'https';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    proto = 'http';
  }
  
  process.env.NEXTAUTH_URL = `${proto}://${host}`;
  

  // 1. Force headers to trust HTTPS
  const newHeaders = new Headers(request.headers);
  newHeaders.set('x-forwarded-proto', proto);
  Object.defineProperty(request, 'headers', {
    value: newHeaders,
    configurable: true,
    writable: false
  });
  
  // 2. Force request.url to use HTTPS scheme to prevent NextAuth from redirecting internally
  const requestUrl = new URL(request.url);
  requestUrl.protocol = proto + ':';
  Object.defineProperty(request, 'url', {
    value: requestUrl.toString(),
    configurable: true,
    writable: false
  });
  
  // 3. Force request.nextUrl protocol
  if (request.nextUrl) {
    try {
      request.nextUrl.protocol = proto + ':';
    } catch (e) {
      // Safe fallback
    }
  }

  return NextAuth(authOptions)(request, context);
}

export { handler as GET, handler as POST };
