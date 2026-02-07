import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load the .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI;

console.log('Testing Connection to:', uri);

if (!uri) {
    console.error('ERROR: MONGO_URI is undefined. Check your .env file or path.');
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => {
        console.log('SUCCESS: Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('FAILURE: Could not connect to MongoDB.');
        console.error(err);
        process.exit(1);
    });
