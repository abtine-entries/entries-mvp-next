import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        // Capture previous login timestamp before updating
        const previousLoginAt = user.lastLoginAt ? user.lastLoginAt.toISOString() : null

        // Update lastLoginAt to now (non-blocking — don't let this crash login)
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
        } catch (e) {
          console.error('Failed to update lastLoginAt:', e)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          lastLoginAt: previousLoginAt,
        } as { id: string; email: string; name: string | null; lastLoginAt: string | null }
      },
    }),
  ],
})
