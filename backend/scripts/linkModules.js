import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Module from '../models/Module.js';
import Section from '../models/Section.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const linkModulesToSections = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Note: By changing schema code, Mongoose might cast string to ObjectId and fail if we just find().
        // However, we are running this script separate process.
        // We typically need to "unschedule" the schema validation or use `lean()` slightly?
        // Actually, if the field contains a String that is valid ObjectId, it works. 
        // If it contains "Frontend", Mongoose cast error will happen on find?
        // No, typically cast happens on save or query filter. `find({})` should retrieve documents.
        // The issue is the data IN the db is "Is String", but Schema says "ObjectId".
        // Mongoose might strip the field if it fails casting.

        // Strategy: Use a distinct connection or model definition to read raw data, OR just use `collection`.

        const db = mongoose.connection.db;
        const modulesCollection = db.collection('modules');
        const sectionsCollection = db.collection('sections');

        const allModules = await modulesCollection.find({}).toArray();
        const allSections = await sectionsCollection.find({}).toArray();

        console.log(`Found ${allModules.length} modules and ${allSections.length} sections.`);

        for (const mod of allModules) {
            // Check if section is already an ObjectId (if script ran partially)
            // But raw data might be string "Frontend"

            const currentSectionVal = mod.section;

            if (currentSectionVal && typeof currentSectionVal === 'string') {
                // Find matching section
                // Try to find by Name
                const matchedSection = allSections.find(s => s.name === currentSectionVal);

                if (matchedSection) {
                    await modulesCollection.updateOne(
                        { _id: mod._id },
                        { $set: { section: matchedSection._id } }
                    );
                    console.log(`Updated module "${mod.title}" to Section ID: ${matchedSection._id} (${matchedSection.name})`);
                } else {
                    // Fallback to "Other"
                    const otherSection = allSections.find(s => s.name === 'Other');
                    if (otherSection) {
                        await modulesCollection.updateOne(
                            { _id: mod._id },
                            { $set: { section: otherSection._id } }
                        );
                        console.log(`Module "${mod.title}" section "${currentSectionVal}" not found. Moved to "Other".`);
                    } else {
                        console.warn(`WARNING: "Other" section missing. Module "${mod.title}" left with string section.`);
                    }
                }
            }
        }

        console.log('Linking complete.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

linkModulesToSections();
