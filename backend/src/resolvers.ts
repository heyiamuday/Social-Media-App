import { Resolvers } from './generated/graphql'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const APP_SECRET = process.env.APP_SECRET || 'supersecret123'

export const resolvers: Resolvers = {
  Mutation: {
    signup: async (_, { name, email, password }) => {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) throw new Error('Email already exists')
      
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword }
      })
      return jwt.sign({ userId: user.id }, APP_SECRET)
    },

    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) throw new Error('Invalid credentials')

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) throw new Error('Invalid credentials')

      return jwt.sign({ userId: user.id }, APP_SECRET)
    }
  }
}