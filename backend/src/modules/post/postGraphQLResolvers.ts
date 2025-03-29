import { Resolvers } from '../../../generated/graphql';
import { PrismaClient } from '@prisma/client';
import { getUserId } from '../../utils/token'; // need this for authentication

const prisma = new PrismaClient();

export const postResolvers: Resolvers = {
  Query: {
    allPosts: async () => {
      return prisma.post.findMany({ 
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Order by newest first
        },
        });
    },
    postsByUser: async (_parent, { userId }) => {
      return prisma.post.findMany({
        where: { authorId: parseInt(userId) },
        include: { author: true },
      });
    },
  },

  Mutation: {
    createPost: async (_parent, { imageUrl, caption }, context) => {
      const userId = getUserId(context);
      if (!userId) {
        throw new Error('Authentication required');
      }

      const newPost = await prisma.post.create({
        data: {
          imageUrl,
          caption,
          authorId: userId,
        },
        include: {
          author: true,
        },
      });
      return newPost;
    },
  },

  Post: {
    author: (parent) => {
      return prisma.post.findUnique({ where: { id: parent.id } }).author();
    },
  },
};