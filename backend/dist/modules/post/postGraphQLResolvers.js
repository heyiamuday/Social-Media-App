import { getUserId } from '../../utils/token.js'; // Keep .js extension here
import { prisma } from '../../lib/prisma.js';
// Removed the helper function as field resolvers will handle mapping
export const postResolvers = {
    Query: {
        // Return PrismaPost directly, field resolvers handle nested types
        allPosts: async () => {
            return prisma.post.findMany({
                // Include authorId for the field resolver
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    imageUrl: true,
                    caption: true,
                    authorId: true, // Ensure authorId is selected
                    // author field resolved by Post.author
                    // likeCount resolved by Post.likeCount
                    // likedByCurrentUser resolved by Post.likedByCurrentUser
                    // comments resolved by Post.comments (if needed)
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        },
        // Return PrismaPost directly
        postsByUser: async (_parent, { userId }) => {
            return prisma.post.findMany({
                where: { authorId: parseInt(userId) },
                // Select necessary fields, author resolved by Post.author
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    imageUrl: true,
                    caption: true,
                    authorId: true, // Ensure authorId is selected
                },
            });
        },
        // Return PrismaComment directly
        CommentsByPost: async (_parent, { postId }) => {
            return prisma.comment.findMany({
                where: { postId: parseInt(postId, 10) },
                orderBy: { createdAt: 'asc' },
                // Select necessary fields, author resolved by Comment.author
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    text: true,
                    author: {
                        select: {
                            id: true,
                            name: true, // Include name field to satisfy GraphQL schema
                            username: true,
                            avatarUrl: true
                        }
                    },
                    authorId: true, // Ensure authorId is selected
                    postId: true, // Ensure postId is selected
                },
            });
        },
    },
    Mutation: {
        // Return PrismaPost directly
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
                // No include needed here, field resolvers handle nested fields
            });
            return newPost; // Return the created post object
        },
        // Return DeletePostResponse type
        deletePost: async (_parent, { id }, context) => {
            const userId = getUserId(context);
            if (!userId) {
                return {
                    success: false,
                    message: 'Authentication required',
                    id: id
                };
            }
            const postIdInt = parseInt(id, 10);
            const postToDelete = await prisma.post.findUnique({
                where: { id: postIdInt },
            });
            if (!postToDelete) {
                return {
                    success: false,
                    message: 'Post not found',
                    id: id
                };
            }
            if (postToDelete.authorId !== userId) {
                return {
                    success: false,
                    message: 'Not authorized to delete this post',
                    id: id
                };
            }
            try {
                // Use transaction for atomic delete
                await prisma.$transaction(async (tx) => {
                    await tx.like.deleteMany({ where: { postId: postIdInt } });
                    await tx.comment.deleteMany({ where: { postId: postIdInt } });
                    await tx.post.delete({ where: { id: postIdInt } });
                });
                return {
                    success: true,
                    message: `Post ${id} deleted successfully`,
                    id: id
                };
            }
            catch (error) {
                console.error("Error deleting post:", error);
                return {
                    success: false,
                    message: 'Failed to delete post due to server error',
                    id: id
                };
            }
        },
        // Return PrismaPost or null
        toggleLike: async (_parent, { postId }, context) => {
            const userId = getUserId(context);
            if (!userId) {
                throw new Error('Authentication required');
            }
            const postIdInt = parseInt(postId, 10);
            const userIdInt = userId; // userId from getUserId is already number
            const like = await prisma.like.findUnique({
                where: {
                    userId_postId: {
                        userId: userIdInt,
                        postId: postIdInt
                    },
                }
            });
            if (like) {
                await prisma.like.delete({
                    where: {
                        id: like.id
                    }
                });
            }
            else {
                await prisma.like.create({
                    data: {
                        userId: userIdInt,
                        postId: postIdInt
                    }
                });
            }
            // Return the post object itself, field resolvers will handle nested fields
            const updatedPost = await prisma.post.findUnique({
                where: { id: postIdInt }
            });
            if (!updatedPost) {
                throw new Error(`Post with ID ${postIdInt} not found.`);
            }
            return updatedPost;
        },
        // Return PrismaComment directly
        addComment: async (_parent, { postId, text }, context) => {
            const userId = getUserId(context);
            if (!userId) {
                throw new Error('Authentication required');
            }
            const newComment = await prisma.comment.create({
                data: {
                    text,
                    postId: parseInt(postId, 10),
                    authorId: userId
                },
                // No include needed here, field resolvers will handle nested fields
            });
            return newComment; // Returns the raw PrismaComment object (only has authorId)
        },
    },
    // Field resolvers for nested types
    Post: {
        // Resolve author for a Post
        author: async (parent) => {
            if (!parent.authorId) {
                throw new Error(`Author ID is missing for post ${parent.id}`);
            }
            const user = await prisma.user.findUnique({
                where: { id: parent.authorId },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    bio: true,
                    avatarUrl: true,
                    password: true // Include password field for type compatibility
                }
            });
            if (!user) {
                throw new Error(`Author with ID ${parent.authorId} not found for post ${parent.id}`);
            }
            return user;
        },
        likeCount: async (parent) => {
            return prisma.like.count({
                where: { postId: parent.id },
            });
        },
        likedByCurrentUser: async (parent, _args, context) => {
            const userId = getUserId(context);
            if (!userId) {
                return false;
            }
            const like = await prisma.like.findUnique({
                where: {
                    userId_postId: {
                        userId: userId, // Use number directly
                        postId: parent.id,
                    },
                },
            });
            return Boolean(like);
        },
        // Resolve comments for a Post (if needed by frontend query)
        comments: async (parent) => {
            return prisma.comment.findMany({
                where: { postId: parent.id },
                orderBy: { createdAt: 'asc' },
                // Select fields needed for Comment type, author resolved separately
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    text: true,
                    authorId: true,
                    postId: true,
                }
            });
        }
    },
    Comment: {
        // Resolve author for a Comment
        author: async (parent) => {
            console.log(`Comment.author resolver: parent comment ID = ${parent.id}, authorId = ${parent.authorId}`);
            if (!parent.authorId) {
                console.error(`Comment.author resolver: FATAL - authorId is missing for comment ID ${parent.id}`);
                throw new Error(`Data integrity issue: Comment ${parent.id} is missing an authorId.`);
            }
            try {
                const user = await prisma.user.findUnique({
                    where: { id: parent.authorId },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        bio: true,
                        avatarUrl: true,
                        password: true // Include password field for type compatibility
                    }
                });
                console.log(`Comment.author resolver: Found user for authorId ${parent.authorId}:`, user ? user.id : 'null');
                if (!user) {
                    console.error(`Comment.author resolver: at line 295: User not found in DB for authorId ${parent.authorId} on comment ${parent.id}`);
                    throw new Error(`Data integrity issue: Author with ID ${parent.authorId} not found for comment ${parent.id}.`);
                }
                return user;
            }
            catch (error) {
                console.error(`Comment.author resolver: Database error fetching user for authorId ${parent.authorId}:`, error);
                throw new Error(`Failed to fetch author for comment ${parent.id}.`);
            }
        },
        // Resolve post for a Comment
        post: async (parent) => {
            if (!parent.postId) {
                throw new Error(`Post ID is missing for comment ${parent.id}`);
            }
            const post = await prisma.post.findUnique({
                where: { id: parent.postId },
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    imageUrl: true,
                    caption: true,
                    authorId: true,
                }
            });
            if (!post) {
                throw new Error(`Post with ID ${parent.postId} not found for comment ${parent.id}`);
            }
            return post;
        }
    }
};
