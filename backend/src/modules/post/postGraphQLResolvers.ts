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
    
    deletePost: async (_parent, {id}, context ) => {
      const userId = getUserId(context);
      if (!userId) {
        throw new Error('Authentication required');
      }

      const postIdInt = parseInt(id, 10);

       // 1. Check if the post exists
      const deleteThisPost = await prisma.post.findUnique({
        where: {id: postIdInt },
        include: {author: true},
      });
    // 2. Verify if the user is the author of the post (authorization)
      if(deleteThisPost?.authorId !== userId ) {
        throw new Error ('not authorized')
      }
        // 3. Delete the post
        try {
          await prisma.post.delete({
            where: { id: postIdInt },
          });
          // 4. Return to success (optional)
          return {
            success: true,
            message: `Post ${id} deleted `,
          };
        } catch (error) {
          console.error("Error deleting post:", error);
          throw new Error('Failed to delete post on post reslovers');
        }
      },
      
      toggleLike: async (_parent, {postId }, context ) => {
        const userId = getUserId(context);
        //if   userId not appear in database he is stalker haha
        if (!userId) {
          throw new Error('Authentication required');
        }

        //Define like
        const like = await prisma.like.findUnique({
          where : {
            ///consider likes with only unique postId,userId
            userId_postId: {
              userId : parseInt(userId),
              postId : parseInt(postId)
            },
          }
        });

        //if it's already liked it delete it
        if(like) {
          await prisma.like.delete({
            where :{
              id: like.id
            }
          })
          //else create a like by refernece userId , postId
        } else {
          await prisma.like.create({
            data :{
              userId : parseInt(userId),
              postId : parseInt(postId)
            }
          })
        }
        //return post
        return prisma.post.findUnique({
          where: {id: parseInt(postId)}
        })
    },   
  },
  
  Post: {
    likeCount: async (parent) => {
      const count = await prisma.like.count({
        where: { postId: parent.id },
      });
      return count;
    },
    likedByCurrentUser: async (parent, _args, context) => {
      const userId = getUserId(context);
      if (!userId) {
        return false;
      }
      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: parseInt(userId),
            postId: parent.id,
          },
        },
      });
      return Boolean(like);
    },
    author: (parent) => {
      return prisma.post.findUnique({ 
        where: { id: parent.id } }).author();
    },
  },
};



