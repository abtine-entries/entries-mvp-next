import type { NextAuthConfig } from 'next-auth'

/**
 * Auth config shared between middleware (Edge) and server (Node.js).
 * This file MUST NOT import anything that uses Node.js APIs (prisma, path, etc.)
 * because it is used in Edge middleware.
 */
export const authConfig = {
  providers: [],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.lastLoginAt = (user as unknown as Record<string, unknown>).lastLoginAt as string | null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        ;(session.user as unknown as Record<string, unknown>).lastLoginAt = token.lastLoginAt as string | null
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth')

      if (isPublicRoute) return true
      if (pathname.startsWith('/workspace') && !isLoggedIn) {
        return Response.redirect(new URL(`/login?callbackUrl=${pathname}`, nextUrl))
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig
