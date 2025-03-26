import { Resolvers } from '../../../generated/graphql'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const postResolvers: Resolvers = {
  Post: {
    author: (parent) => {
      return prisma.post
        .findUnique({ where: { id: parent.id } })
        .author()
    }
  }
}