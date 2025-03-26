import { Resolvers } from './generated/graphql'
import { userResolvers } from './modules/user/userGraphQLResolvers'
import { postResolvers } from './modules/post/postGraphQLResolvers'

export const resolvers: Resolvers = {
  Query: {
    ...userResolvers.Query,
    ...postResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation
  },
  User: {
    ...userResolvers.User
  },
  Post: {
    ...postResolvers.Post
  }
}