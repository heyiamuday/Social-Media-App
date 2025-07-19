// backend/src/server.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express, { Request } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createContext } from './context.js';
import { readFileSync } from 'fs';
import path from 'path';
import { resolvers } from './resolvers.js';
import { DateTimeResolver } from 'graphql-scalars';
import cloudinary from './utils/cloudinary.js';
import multer from 'multer'; // For handling file uploads like images we used in the post creation      

// Get correct __dirname for ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
// Use path.resolve for reliable path resolution
//const schemaString = readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf-8');
const schemaString = readFileSync(path.resolve(process.cwd(), 'schema.graphql'), 'utf-8'); 

// Prepend the scalar definition to the schema string
const typeDefs = `
scalar DateTime

${schemaString}
`;

// Combine your resolvers with the DateTime scalar resolver
const combinedResolvers = {
  ...resolvers,
  DateTime: DateTimeResolver,
};

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 4000;

  const server = new ApolloServer({
    typeDefs,
    resolvers: combinedResolvers,
  });

  await server.start();

  // A more robust, production-ready CORS configuration
  const allowedOrigins = [
    'https://secrettalksonly.netlify.app', // Your production site
    // This regex allows all Netlify deploy previews to connect automatically
    /^https:\/\/deploy-preview-\d+--secrettalksonly\.netlify\.app$/,
  ];

  if (process.env.NODE_ENV !== 'production') {
    // Allow any localhost port for local development
    allowedOrigins.push(/^http:\/\/localhost:\d+$/);
  }

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps)
      if (!origin) return callback(null, true);

      // Check if the incoming origin is in our list
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('This origin is not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-apollo-operation-name', 'apollo-require-preflight'],
    credentials: true,
  };

  // Apply CORS middleware to the entire app
  app.use(cors<cors.CorsRequest>(corsOptions));

  // Handle OPTIONS requests explicitly
  app.options('*', cors<cors.CorsRequest>(corsOptions));

  app.use(bodyParser.json());

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => createContext(req),
    })
  );

  // Add your /upload-image route handler here
  const storage = multer.memoryStorage(); // Store the file in memory
  const upload = multer({ storage: storage });

  // Extend the Request interface
  interface MulterRequest extends Request {
    file?: Express.Multer.File;
  }

  app.post('/upload-image', upload.single('image'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
      }

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

      const result = await cloudinary.uploader.upload(dataURI);
      res.json({ imageUrl: result.secure_url });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      res.status(500).json({ error: 'Failed to upload image.' });
    }
  });

  app.listen(port, () => {
    console.log(`🚀 Server ready on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});