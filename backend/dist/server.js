// backend/src/server.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
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
        'https://secrettalksonly.netlify.app',
        'https://secrethub.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173',
        /^https:\/\/.*\.netlify\.app$/, // Allow all Netlify subdomains
    ];
    if (process.env.NODE_ENV !== 'production') {
        // Allow any localhost port for local development
        allowedOrigins.push(/^http:\/\/localhost:\d+$/);
    }
    const corsOptions = {
        origin: (origin, callback) => {
            console.log('Request origin:', origin); // Debug log
            // Allow requests with no origin (like curl, mobile apps)
            if (!origin) {
                callback(null, true);
                return;
            }
            // Check if the incoming origin is in our list
            const isAllowed = allowedOrigins.some(allowed => {
                if (typeof allowed === 'string')
                    return allowed === origin;
                if (allowed instanceof RegExp)
                    return allowed.test(origin);
                return false;
            });
            if (isAllowed) {
                callback(null, true);
            }
            else {
                console.log('Origin not allowed:', origin); // Debug log
                callback(new Error(`CORS not allowed for origin: ${origin}`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-apollo-operation-name',
            'apollo-require-preflight',
            'Origin',
            'Accept'
        ],
        exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'],
        maxAge: 86400,
        preflightContinue: false,
    };
    // Apply CORS middleware to the entire app
    app.use(cors(corsOptions));
    // Handle CORS errors
    app.use((err, req, res, next) => {
        if (err.message === 'Not allowed by CORS') {
            res.status(403).json({
                error: 'CORS Error',
                message: 'This origin is not allowed to access this resource',
                origin: req.headers.origin
            });
        }
        else {
            next(err);
        }
    });
    app.use(bodyParser.json());
    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req }) => createContext(req),
    }));
    // Add an error handler specifically for GraphQL endpoint
    app.use('/graphql', (err, req, res, next) => {
        console.error('GraphQL Error:', err);
        if (err.message.includes('CORS')) {
            res.status(403).json({
                error: 'CORS Error',
                message: err.message,
                origin: req.headers.origin
            });
        }
        else {
            next(err);
        }
    });
    // Add your /upload-image route handler here
    const storage = multer.memoryStorage(); // Store the file in memory
    const upload = multer({ storage: storage });
    app.post('/upload-image', upload.single('image'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No image file provided.' });
            }
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
            const result = await cloudinary.uploader.upload(dataURI);
            res.json({ imageUrl: result.secure_url });
        }
        catch (error) {
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
