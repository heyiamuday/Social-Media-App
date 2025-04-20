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
    // Apply CORS middleware to the entire app
    app.use(cors({
        origin: ['http://localhost:3000', 'https://localhost:3000'], // Allow both HTTP and HTTPS
        credentials: true,
    }));
    app.use(bodyParser.json());
    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req }) => createContext(req),
    }));
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
        console.log(`🚀 Server ready at https://localhost:${port}/graphql`);
    });
}
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
