import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

const seedAdmin = async () => {
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
        console.log('Admin already exists');
        process.exit();
    }

    const user = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
    });

    console.log('Admin created:', user);
    process.exit();
};

seedAdmin();
