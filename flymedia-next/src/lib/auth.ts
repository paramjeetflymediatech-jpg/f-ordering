import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User, Role, Permission } from '../models';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        store_id: { label: 'Store ID', type: 'text' },
        organization_id: { label: 'Organization ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        const users = await User.findAll({
          where: { email: credentials.email, status: 'active' },
          include: [
            {
              model: Role,
              include: [Permission],
            },
          ],
        });

        if (!users || users.length === 0) {
          throw new Error('No active user found with this email');
        }

        const requestedStoreId = (credentials as any)?.store_id;
        const requestedOrgId = (credentials as any)?.organization_id;

        let candidateUsers = users;
        if (requestedStoreId || requestedOrgId) {
          const filtered = users.filter((u: any) => 
            (!requestedStoreId || u.store_id === requestedStoreId) &&
            (!requestedOrgId || u.organization_id === requestedOrgId)
          );
          if (filtered.length > 0) {
            candidateUsers = filtered;
          }
        }

        let user: any = null;
        for (const candidate of candidateUsers) {
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            candidate.password
          );
          if (isPasswordCorrect) {
            user = candidate;
            break;
          }
        }

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Get flat list of role names and permission names
        const roles = (user as any).Roles?.map((r: any) => r.name) || [];
        const permissions = (user as any).Roles?.flatMap((r: any) =>
          r.Permissions?.map((p: any) => p.name) || []
        ) || [];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          organization_id: user.organization_id,
          store_id: user.store_id,
          roles,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If it's already a relative path, use it directly
      if (url.startsWith('/')) {
        return url;
      }
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(baseUrl);
        
        // If the redirect is to the same domain (or a subdomain), allow it
        const getBaseDomain = (host: string) => {
          const parts = host.split('.');
          if (parts.length > 2) {
            return parts.slice(-2).join('.');
          }
          return host;
        };

        if (parsedUrl.host === parsedBase.host || getBaseDomain(parsedUrl.hostname) === getBaseDomain(parsedBase.hostname)) {
          return url;
        }

        // Return the absolute URL directly to keep the browser on the live domain and prevent client-side crash
        return url;
      } catch (e) {
        // Safe fallback
      }
      return '/login';
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organization_id = (user as any).organization_id;
        token.store_id = (user as any).store_id;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          organization_id: token.organization_id as string,
          store_id: token.store_id as string,
          roles: token.roles as string[],
          permissions: token.permissions as string[],
        } as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 3650 * 24 * 60 * 60, // 10 years (persistent/forever login)
  },
  secret: process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod',
};
