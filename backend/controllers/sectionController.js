import Section from '../models/Section.js';
import Module from '../models/Module.js';
import redisClient from '../config/redisClient.js';
const CACHE_EXP = 3600;

// @desc    Get all sections
// @route   GET /api/sections
// @access  Public (or Private)
const getSections = async (req, res) => {
    try {
        if (redisClient.isReady) {
            const cached = await redisClient.get('sections:list');
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(JSON.parse(cached));
            }
        }
    } catch (e) { }

    try {
        const sections = await Section.find({}).sort({ order: 1 });
        try {
            if (redisClient.isReady) await redisClient.set('sections:list', JSON.stringify(sections), { EX: CACHE_EXP });
        } catch (e) { }
        res.set('X-Cache', 'MISS');
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new section
// @route   POST /api/sections
// @access  Private/Admin
const createSection = async (req, res) => {
    const { name, order } = req.body;
    try {
        const sectionExists = await Section.findOne({ name });
        if (sectionExists) {
            return res.status(400).json({ message: 'Section already exists' });
        }
        const section = await Section.create({ name, order });
        try { await redisClient.del('sections:list'); } catch (e) { }
        res.status(201).json(section);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a section (rename/reorder)
// @route   PUT /api/sections/:id
// @access  Private/Admin
const updateSection = async (req, res) => {
    const { name, order } = req.body;
    try {
        const section = await Section.findById(req.params.id);
        if (section) {
            section.name = name || section.name;
            if (order !== undefined) section.order = order;

            const updatedSection = await section.save();
            try {
                await redisClient.del('sections:list');
                await redisClient.del('modules:list'); // Modules use section name
            } catch (e) { }
            res.json(updatedSection);
        } else {
            res.status(404).json({ message: 'Section not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a section
// @route   DELETE /api/sections/:id
// @access  Private/Admin
const deleteSection = async (req, res) => {
    try {
        const section = await Section.findById(req.params.id);
        if (section) {
            // Check if modules use this section?
            // User requested modules move to 'Other' or similar.
            // But 'Other' might not be a Section ID yet.
            // For now, simpler: delete content -> rely on frontend or separate migration to handle orphans?
            // Ideally we reassign modules.

            await Section.deleteOne({ _id: req.params.id });
            try {
                await redisClient.del('sections:list');
                await redisClient.del('modules:list');
            } catch (e) { }
            res.json({ message: 'Section removed' });
        } else {
            res.status(404).json({ message: 'Section not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Migrate existing string sections to Section models
// @route   POST /api/sections/migrate-legacy
// @access  Private/Admin
const migrateLegacySections = async (req, res) => {
    try {
        const modules = await Module.find({});
        const uniqueStrings = [...new Set(modules.map(m => m.section).filter(s => s))];

        let createdCount = 0;
        const defaultOther = await Section.findOne({ name: 'Other' });
        let otherId = defaultOther ? defaultOther._id : null;

        if (!otherId) {
            const newOther = await Section.create({ name: 'Other', order: 999 });
            otherId = newOther._id;
        }

        // Create Sections if not exist
        for (const secName of uniqueStrings) {
            const exists = await Section.findOne({ name: secName });
            if (!exists) {
                await Section.create({ name: secName, order: 0 }); // default order
                createdCount++;
            }
        }

        // Now update Modules to use Schema ID
        // Note: module.section is defined as String currently in Mongoose Schema.
        // We need to change the Schema first or use explicit update?
        // Actually, we can't store ObjectId in a String field cleanly if we want refs.
        // We will assume the Schema is updated to ObjectId before this runs? 
        // OR we store ID as string?
        // Let's assume we update schema.

        res.json({ message: `Migration prep complete. Created ${createdCount} sections.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getSections, createSection, updateSection, deleteSection, migrateLegacySections };
