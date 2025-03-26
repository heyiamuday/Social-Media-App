import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createContext } from './context';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from './resolvers';


// Get correct __dirname for ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('Current working directory:', process.cwd());

console.log('__dirname:', __dirname);
const typeDefs = readFileSync(path.join(__dirname, '../schema.graphql'), 'utf-8');

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 4000;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req),
    })
  );

  app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});