import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Module from '../models/Module.js';
import Section from '../models/Section.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const modules = await Module.find({});
        const uniqueStrings = [...new Set(modules.map(m => m.section).filter(s => s))];
        console.log('Found sections:', uniqueStrings);

        // Ensure default sections exist
        const defaults = ['Programming Languages', 'Frontend', 'Backend', 'Database', 'Aptitude', 'Other'];
        for (const def of defaults) {
            if (!uniqueStrings.includes(def)) uniqueStrings.push(def);
        }

        for (const secName of uniqueStrings) {
            const exists = await Section.findOne({ name: secName });
            if (!exists) {
                await Section.create({ name: secName, order: defaults.indexOf(secName) >= 0 ? defaults.indexOf(secName) : 99 });
                console.log(`Created section: ${secName}`);
            }
        }

        console.log('Migration complete. You may now perform the schema update on Module if desired.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

migrate();
