import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import type { NextRequest } from 'next/server';

async function handler(request: NextRequest, context: any) {
  const host = request.headers.get('host') || 'fly-pos.com';
  let proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    proto = 'http';
  }
  
  process.env.NEXTAUTH_URL = `${proto}://${host}`;
  
  return NextAuth(authOptions)(request, context);
}

export { handler as GET, handler as POST };
