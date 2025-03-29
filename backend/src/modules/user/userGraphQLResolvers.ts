import { Resolvers } from '../../../generated/graphql';
import { PrismaClient } from '@prisma/client';
import { getUserId, APP_SECRET } from '../../utils/token';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const userResolvers: Resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      try {
        const userId = getUserId(context);
        return prisma.user.findUnique({
          where: { id: userId },
          include: { posts: true },
        });
      } catch (error) {
        console.error('me resolver error', error);
        throw error;
      }
    },
    allUsers: async () => {
      return prisma.user.findMany();
    },
  },

  Mutation: {
    signup: async (_, { name, username, email, password }) => {
      const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
      if (existingUserWithEmail) throw new Error('Email already exists');

      const existingUserWithUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUserWithUsername) throw new Error('Username already exists');

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, username, email, password: hashedPassword },
      });
      const token = jwt.sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },

    login: async (_, { loginIdentifier, password }) => {
      console.log('loginIdentifier:', loginIdentifier); // Keep this for debugging

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: loginIdentifier }, 
            { username: loginIdentifier }, 
          ],
        },
      });

      if (!user) throw new Error('Invalid credentials');

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Invalid credentials');

      const token = jwt.sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },

    updateProfile: async (_parent, { name, username, email, bio }, context) => {
      const userId = getUserId(context);
      // Need to add checks here to ensure the user owns this profile
      // and prevent updating email/username if they are already taken
      const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser && existingUser.id !== userId) {
        throw new Error('Username already taken');
      }


      const updateUser = await prisma.user.update({
        where: { id: userId },
        data: { name, username, email, bio },
      });
      return updateUser;
    },
  },

  User: {
    posts: (parent) => {
      return prisma.user.findUnique({ where: { id: parent.id } }).posts();
    },
  },
};