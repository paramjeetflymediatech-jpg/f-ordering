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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        const user = await User.findOne({
          where: { email: credentials.email, status: 'active' },
          include: [
            {
              model: Role,
              include: [Permission],
            },
          ],
        });

        if (!user) {
          throw new Error('No active user found with this email');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'supersecretposplatformkeychangeinprod',
};
