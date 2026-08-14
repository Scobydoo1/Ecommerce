import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@ecommerce/auth-db';
import { verifyPassword } from './password';

/**
 * Auth.js v5 voi phien dang JWT.
 *
 * Chon JWT chu khong phai phien luu DB: provider Credentials khong dung duoc
 * phien DB, va JWT giup order-service khong phai tra cuu nguoc lai storefront.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? '');

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        // Van chay verifyPassword khi khong tim thay tai khoan de thoi gian
        // phan hoi khong tiet lo email nao da dang ky.
        const ok = await verifyPassword(password, user?.passwordHash ?? '');
        if (!user || !ok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
