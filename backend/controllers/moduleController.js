import Module from '../models/Module.js';
import Question from '../models/Question.js';
import Section from '../models/Section.js';
import mongoose from 'mongoose';
import redisClient from '../config/redisClient.js';
const CACHE_EXP = 3600; // 1 hour

// @desc    Create a new module
// @route   POST /api/modules
// @access  Private/Admin
const createModule = async (req, res) => {
    const { title, description, section, order, isFeatured, featuredOrder } = req.body;
    const module = new Module({
        title,
        description,
        section,
        order,
        isFeatured,
        featuredOrder,
        isDisplay: req.body.isDisplay !== undefined ? req.body.isDisplay : true,
        createdBy: req.user._id
    });
    const createdModule = await module.save();

    // Invalidate List Cache
    try { await redisClient.del('modules:list'); } catch (e) { }

    res.status(201).json(createdModule);
};

// @desc    Get all modules
// @route   GET /api/modules
// @access  Private
const getModules = async (req, res) => {
    try {
        if (redisClient.isReady) {
            const cached = await redisClient.get('modules:list');
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(JSON.parse(cached));
            }
        }
    } catch (e) { }

    const modules = await Module.find({}).populate('section', 'name order');

    try { await redisClient.set('modules:list', JSON.stringify(modules), { EX: CACHE_EXP }); } catch (e) { }

    res.set('X-Cache', 'MISS');
    res.json(modules);
};

// @desc    Get module by ID (with questions)
// @route   GET /api/modules/:id
// @access  Private
const getModuleById = async (req, res) => {
    const key = `modules:${req.params.id}`;
    try {
        if (redisClient.isReady) {
            const cached = await redisClient.get(key);
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(JSON.parse(cached));
            }
        }
    } catch (e) { }

    const module = await Module.findById(req.params.id).populate('section', 'name order');
    if (module) {
        const questions = await Question.find({ moduleId: module._id });
        const result = { ...module.toObject(), questions };

        try { await redisClient.set(key, JSON.stringify(result), { EX: CACHE_EXP }); } catch (e) { }

        res.set('X-Cache', 'MISS');
        res.json(result);
    } else {
        res.status(404).json({ message: 'Module not found' });
    }
};

// @desc    Add question to module
// @route   POST /api/modules/:id/questions
// @access  Private/Admin
const addQuestion = async (req, res) => {
    const { questionText, options, correctOptionIndex, explanation, level } = req.body;

    const moduleExists = await Module.findById(req.params.id);
    if (!moduleExists) {
        return res.status(404).json({ message: 'Module not found' });
    }

    const question = new Question({
        moduleId: req.params.id,
        questionText,
        options,
        correctOptionIndex,
        explanation,
        level
    });

    const createdQuestion = await question.save();

    try { await redisClient.del(`modules:${req.params.id}`); } catch (e) { }

    res.status(201).json(createdQuestion);
};

// @desc    Delete question
// @route   DELETE /api/modules/:id/questions/:qId
// @access  Private/Admin
const deleteQuestion = async (req, res) => {
    const question = await Question.findById(req.params.qId);
    if (question) {
        await Question.deleteOne({ _id: req.params.qId });
        try { await redisClient.del(`modules:${req.params.id}`); } catch (e) { }
        res.json({ message: 'Question removed' });
    } else {
        res.status(404).json({ message: 'Question not found' });
    }
};

// @desc    Update question
// @route   PUT /api/modules/:id/questions/:qId
// @access  Private/Admin
const updateQuestion = async (req, res) => {
    const { questionText, options, correctOptionIndex, explanation, level } = req.body;

    const question = await Question.findById(req.params.qId);

    if (question) {
        question.questionText = questionText || question.questionText;
        question.options = options || question.options;
        if (correctOptionIndex !== undefined) question.correctOptionIndex = correctOptionIndex;
        if (explanation !== undefined) question.explanation = explanation;
        if (level !== undefined) question.level = level;

        const updatedQuestion = await question.save();
        try { await redisClient.del(`modules:${req.params.id}`); } catch (e) { }
        res.json(updatedQuestion);
    } else {
        res.status(404).json({ message: 'Question not found' });
    }
};

// @desc    Bulk add questions to module
// @route   POST /api/modules/:id/questions/bulk
// @access  Private/Admin
const bulkAddQuestions = async (req, res) => {
    const { questions } = req.body; // Expecting array of question objects

    const moduleExists = await Module.findById(req.params.id);
    if (!moduleExists) {
        return res.status(404).json({ message: 'Module not found' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'No questions provided or invalid format' });
    }

    try {
        const questionsToInsert = questions.map(q => ({
            moduleId: req.params.id,
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation,
            level: q.level || 'Basics'
        }));

        const createdQuestions = await Question.insertMany(questionsToInsert);
        try { await redisClient.del(`modules:${req.params.id}`); } catch (e) { }
        res.status(201).json(createdQuestions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add questions', error: error.message });
    }
};

const deleteModule = async (req, res) => {
    const module = await Module.findById(req.params.id);

    if (module) {
        await Module.deleteOne({ _id: req.params.id });

        // Invalidate List and Item
        try {
            await redisClient.del('modules:list');
            await redisClient.del(`modules:${req.params.id}`);
        } catch (e) { }

        res.json({ message: 'Module removed' });
    } else {
        res.status(404).json({ message: 'Module not found' });
    }
};

// @desc    Update module details
// @route   PUT /api/modules/:id
// @access  Private/Admin
const updateModule = async (req, res) => {
    const { title, description, section, order, isFeatured, featuredOrder } = req.body;

    const module = await Module.findById(req.params.id);

    if (module) {
        module.title = title || module.title;
        module.description = description || module.description;
        module.section = section || module.section;
        if (order !== undefined) module.order = order;
        if (isFeatured !== undefined) module.isFeatured = isFeatured;
        if (featuredOrder !== undefined) module.featuredOrder = featuredOrder;
        if (req.body.isDisplay !== undefined) module.isDisplay = req.body.isDisplay;

        const updatedModule = await module.save();

        // Invalidate List and Item
        try {
            await redisClient.del('modules:list');
            await redisClient.del(`modules:${req.params.id}`);
        } catch (e) { }

        res.json(updatedModule);
    } else {
        res.status(404).json({ message: 'Module not found' });
    }
};

// @desc    Migrate all modules from one section to another
// @route   PUT /api/modules/sections/migrate
// @access  Private/Admin
const migrateSection = async (req, res) => {
    // Expects NAMES from old frontend code? 
    // OR we update frontend to send IDs?
    // Let's support Names for backward compatibility during transition or just update strict.
    // The user wants "stored to particular section id".
    // So let's assuming frontend sends IDs? 
    // Actually the current frontend sends { oldSection: name, newSection: name }.
    // I should update frontend code to use IDs.
    // AND update logic here.

    // BUT! I must handle the case where "Other" fallback is needed.

    // Let's keep this controller simple: expecting IDs?
    // Or lookup IDs by name?
    // "oldSection" and "newSection" in body could be IDs or Names.
    // Given the previous step refactor on frontend was "Hybrid", let's make it robust by trying to find Section by Name if input is not ID.

    let { oldSection, newSection } = req.body;

    // We should really move to IDs.
    // But for safety:
    // const Section = require('../models/Section'); // Moved to top-level import

    try {
        let oldId = oldSection;
        let newId = newSection;

        // Verify if they are names
        if (oldSection && !mongoose.Types.ObjectId.isValid(oldSection)) {
            const s = await Section.findOne({ name: oldSection });
            if (s) oldId = s._id;
        }
        if (newSection && !mongoose.Types.ObjectId.isValid(newSection)) {
            const s = await Section.findOne({ name: newSection });
            if (s) newId = s._id;
        }

        // If "Other" (string fallback)
        if (newSection === 'Other' && !newId) {
            const s = await Section.findOne({ name: 'Other' });
            if (s) newId = s._id;
        }

        if (!oldId || !newId) {
            return res.status(400).json({ message: 'Invalid section identifiers' });
        }

        const result = await Module.updateMany(
            { section: oldId },
            { section: newId }
        );
        try { await redisClient.del('modules:list'); } catch (e) { }
        res.json({ message: `Migrated ${result.modifiedCount} modules.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to migrate section', error: error.message });
    }
};

export { createModule, getModules, getModuleById, updateModule, deleteModule, addQuestion, deleteQuestion, updateQuestion, bulkAddQuestions, migrateSection };
