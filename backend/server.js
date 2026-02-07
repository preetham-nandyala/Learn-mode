import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import moduleRoutes from './routes/moduleRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import testResultRoutes from './routes/testResultRoutes.js';
import authRoutes from './routes/authRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Client and Admin ports
    credentials: true,
}));
app.use(cookieParser());
// const rateLimiter = require('./middleware/rateLimiter');
// app.use(rateLimiter(200, 60)); // Temporarily disabled due to connection issues

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/test-results', testResultRoutes);

app.get('/', (req, res) => res.send('API is running...'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
