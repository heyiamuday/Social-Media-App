import { Resolvers } from '../../../generated/graphql'
import { PrismaClient } from '@prisma/client'
import { getUserId, APP_SECRET } from '../../utils'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const userResolvers: Resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      try{
        const userId = getUserId(context);
        return prisma.user.findUnique({
          where: { id: userId },
          include: { posts: true },
        });
      }catch(error){
        console.error("me resolver error", error);
        throw error;
      }
    },
    allUsers: async () => {
      return prisma.user.findMany()
    }
  },

  Mutation: {
    signup: async (_, { name, email, password }) => {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) throw new Error('Email already exists')
      
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword }
      })
      const token = jwt.sign({ userId: user.id }, APP_SECRET)
      return { token, user }
    },

    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) throw new Error('Invalid credentials')

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) throw new Error('Invalid credentials')

      const token = jwt.sign({ userId: user.id }, APP_SECRET)
      return { token, user }
    }
  },

  User: {
    posts: (parent) => {
      return prisma.user
        .findUnique({ where: { id: parent.id } })
        .posts()
    }
  }
}