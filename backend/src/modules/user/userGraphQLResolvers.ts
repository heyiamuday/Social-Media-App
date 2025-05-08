import { User, Post } from '@prisma/client';
import { getUserId, APP_SECRET } from '../../utils/token.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma.js';

interface ApolloContext {
    req: any;
    prisma: typeof prisma;
    userId?: number;
}

type UserWithPosts = User & { posts?: Post[] };

// Define argument types directly
interface QueryUserProfileArgs {
  username?: string | null;
}

interface MutationSignupArgs {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface MutationLoginArgs {
  loginIdentifier: string;
  password: string;
}

interface MutationUpdateProfileArgs {
  name: string;
  username: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

interface MutationDeletePostArgs {
  id: string;
}

// Define a simplified resolver type
export const userResolvers: any = {
  Query: {
    userProfile: async (_parent: unknown, { username }: QueryUserProfileArgs, context: ApolloContext): Promise<UserWithPosts | null> => {
      try {
        if (username) {
          console.log(`Fetching profile for username: ${username}`);
          const user = await prisma.user.findUnique({
            where: { username: username },
            include: { posts: { orderBy: { createdAt: 'desc' } } },
          });
          if (!user) {
             console.log(`User not found: ${username}`);
             return null;
          }
           console.log(`Found user: ${user.username}`);
          return user;
        } else {
          console.log('Fetching profile for logged-in user');
          const userId = getUserId(context);
          if (!userId) {
             console.log('Authentication required for /profile');
             throw new GraphQLError('User is not authenticated', {
               extensions: { code: 'UNAUTHENTICATED' },
             });
          }
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { posts: { orderBy: { createdAt: 'desc' } } },
          });
           if (!user) {
               console.error(`Logged-in user with ID ${userId} not found in DB.`);
               throw new GraphQLError('Authenticated user not found', {
                   extensions: { code: 'INTERNAL_SERVER_ERROR' },
               });
           }
            console.log(`Found logged-in user: ${user.username}`);
           return user;
        }
      } catch (error: any) {
        console.error('Error in userProfile resolver:', error);
         if (error instanceof GraphQLError) {
           throw error;
         }
        throw new GraphQLError('Could not fetch user profile', {
             extensions: { code: 'INTERNAL_SERVER_ERROR' },
         });
      }
    },

    me: async (_parent: unknown, _args: unknown, context: ApolloContext): Promise<UserWithPosts | null> => {
       console.log('Executing original \'me\' resolver');
       try {
          const userId = getUserId(context);
          return prisma.user.findUnique({
            where: { id: userId },
            include: { posts: { orderBy: { createdAt: 'desc' } } },
          });
       } catch (error) {
           console.error("Error in 'me' resolver:", error);
            if (error instanceof GraphQLError && error.extensions.code === 'UNAUTHENTICATED') {
                throw error;
            }
           throw new GraphQLError('Could not fetch user data', {
               extensions: { code: 'INTERNAL_SERVER_ERROR' },
           });
       }
    },

    allUsers: async (_parent: unknown, _args: unknown, _context: ApolloContext) => {
       console.log('Fetching all users');
      return prisma.user.findMany();
    },
  },

  Mutation: {
    signup: async (_parent: unknown, { name, username, email, password }: MutationSignupArgs, _context: ApolloContext) => {
       try {
          const existingUserWithEmail = await prisma.user.findUnique({ where: { email } });
          if (existingUserWithEmail) throw new GraphQLError('Email already exists', { extensions: { code: 'BAD_USER_INPUT', field: 'email' }});

          const existingUserWithUsername = await prisma.user.findUnique({ where: { username } });
          if (existingUserWithUsername) throw new GraphQLError('Username already exists', { extensions: { code: 'BAD_USER_INPUT', field: 'username' }});

          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await prisma.user.create({
            data: { name, username, email, password: hashedPassword, bio: '' },
          });
          const token = jwt.sign({ userId: user.id }, APP_SECRET);
          return { token, user };
       } catch(error: any) {
            console.error('Signup Error:', error);
            if (error instanceof GraphQLError) throw error;
            throw new GraphQLError('Signup failed', { extensions: { code: 'INTERNAL_SERVER_ERROR' }});
       }
    },

    login: async (_parent: unknown, { loginIdentifier, password }: MutationLoginArgs, _context: ApolloContext) => {
       try {
          console.log('Login attempt:', { loginIdentifier });

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: loginIdentifier },
                { username: loginIdentifier },
              ],
            },
             include: { posts: { orderBy: { createdAt: 'desc' } } }
          });

          console.log('User found:', user ? user.username : 'No');
          
          if (!user) {
            console.log('No user found with this identifier');
            throw new GraphQLError('Invalid username, email, or password.', { 
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }

          if (typeof user.password !== 'string' || user.password.length === 0) {
            console.error('User object does not have a valid password hash for user:', user.id);
            throw new GraphQLError('Login failed due to server configuration issue.', { 
              extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
          }

          console.log('Comparing passwords for user:', user.username);
          const valid = await bcrypt.compare(password, user.password);
          console.log('Password valid:', valid ? 'Yes' : 'No');
          
          if (!valid) {
            console.log('Invalid password for user:', user.username);
            throw new GraphQLError('Invalid username, email, or password.', { 
              extensions: { code: 'BAD_USER_INPUT' }
            });
          }

          console.log('Generating token for user:', user.username);
          const token = jwt.sign({ userId: user.id }, APP_SECRET);
          console.log('Token generated successfully for user:', user.username);
          
          return { token, user };
       } catch(error: any) {
           console.error('An error occurred during login:', error); 

           if (error instanceof GraphQLError) {
             throw error;
           }

           throw new GraphQLError('Login failed due to an unexpected server error. Please try again later.', { 
             extensions: { code: 'INTERNAL_SERVER_ERROR' }
           });
       }
    },

    updateProfile: async (_parent: unknown, args: MutationUpdateProfileArgs, context: ApolloContext) => {
       try {
          console.log(`Updating profile for user ID derived from context`);
          const userId = getUserId(context);
          const { name, username, email, bio, avatarUrl } = args;

          const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
          if (existingUserByUsername && existingUserByUsername.id !== userId) {
            throw new GraphQLError('Username already taken', { extensions: { code: 'BAD_USER_INPUT', field: 'username' }});
          }
          const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
          if (existingUserByEmail && existingUserByEmail.id !== userId) {
            throw new GraphQLError('Email already taken', { extensions: { code: 'BAD_USER_INPUT', field: 'email' }});
          }

          // Use a properly typed update object
          const updateData: any = { 
            name, 
            username, 
            email, 
            bio: bio ?? null 
          };
          
          // Only add avatarUrl if it's provided
          if (avatarUrl !== undefined) {
            updateData.avatarUrl = avatarUrl;
          }

          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { posts: { orderBy: { createdAt: 'desc' } } }
          });
          
          console.log(`Profile updated for user: ${updatedUser.username}`);
          return updatedUser;
       } catch (error: any) {
           console.error('Update Profile Error:', error);
           if (error instanceof GraphQLError) throw error;
           throw new GraphQLError('Failed to update profile', { extensions: { code: 'INTERNAL_SERVER_ERROR' }});
       }
    },

    deletePost: async (_parent: unknown, { id: postId }: MutationDeletePostArgs, context: ApolloContext) => {
        try {
           const userId = getUserId(context);

           const postIdNum = parseInt(postId, 10);
           if (isNaN(postIdNum)) {
              throw new GraphQLError('Invalid Post ID format', { extensions: { code: 'BAD_USER_INPUT' } });
           }

           const post = await prisma.post.findUnique({ 
               where: { id: postIdNum }, 
               select: { authorId: true }
           });

           if (!post) {
             throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } });
           }

           if (post.authorId !== userId) {
             throw new GraphQLError('You are not authorized to delete this post', { extensions: { code: 'FORBIDDEN' } });
           }

           await prisma.post.delete({
             where: { id: postIdNum },
           });

           console.log(`Post ${postIdNum} deleted by user ${userId}`);
           return {
             success: true,
             message: 'Post deleted successfully',
             id: postId,
           };
        } catch (error: any) {
             console.error('Delete Post Error:', error);
             if (error instanceof GraphQLError) throw error;
             throw new GraphQLError('Failed to delete post', { extensions: { code: 'INTERNAL_SERVER_ERROR' }});
        }
     }
  },

  User: {
    posts: (parent: UserWithPosts, _args: unknown, _context: ApolloContext, _info: unknown): Post[] | Promise<Post[]> => {
       if (parent.posts !== undefined) {
         return parent.posts;
       }
       console.warn(`Fetching posts via User.posts field resolver for user ${parent.id}. Consider using 'include' in parent query.`);
       return prisma.post.findMany({
           where: { authorId: parent.id },
           orderBy: { createdAt: 'desc' }
       });
    },
  },
};