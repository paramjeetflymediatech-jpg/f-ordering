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
  
  console.log('[NextAuth Debug]', {
    host,
    originalProto,
    resolvedProto: proto,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV
  });

  // Clone headers and explicitly set x-forwarded-proto to prevent Nginx header override issues
  const newHeaders = new Headers(request.headers);
  newHeaders.set('x-forwarded-proto', proto);
  
  const modifiedRequest = new NextRequest(request, {
    headers: newHeaders,
  });
  
  return NextAuth(authOptions)(modifiedRequest, context);
}

export { handler as GET, handler as POST };
