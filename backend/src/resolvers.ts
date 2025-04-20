import { Resolvers } from './generated/graphql.js'
import { userResolvers } from './modules/user/userGraphQLResolvers.js'
import { postResolvers } from './modules/post/postGraphQLResolvers.js'

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