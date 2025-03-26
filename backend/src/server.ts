// src/server.ts
import path from 'path'
import { fileURLToPath } from 'url'

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolvers } from './resolvers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const typeDefs = readFileSync(
  path.join(__dirname, '../schema.graphql'), 
  'utf-8'
)


async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => ({
      prisma,
      token: req.headers.authorization?.replace('Bearer ', ''),
    }),
  })

  console.log(`🚀 Server ready at ${url}`)
}

startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})