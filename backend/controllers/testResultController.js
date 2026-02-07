import TestResult from '../models/TestResult.js';
import redisClient from '../config/redisClient.js';
const CACHE_EXP = 3600;

// @route   POST /api/test-results
// @access  Private
const submitTestResult = async (req, res) => {
    try {
        const { moduleId, level, score, totalQuestions, answers } = req.body;

        const testResult = new TestResult({
            userId: req.user._id,
            moduleId,
            level,
            score,
            totalQuestions,
            answers
        });

        const savedResult = await testResult.save();

        try { await redisClient.del(`user:${req.user._id}:history`); } catch (e) { }

        res.status(201).json(savedResult);
    } catch (error) {
        console.error('Error saving test result:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   GET /api/test-results/history
// @access  Private
const getUserHistory = async (req, res) => {
    try {
        const key = `user:${req.user._id}:history`;
        try {
            if (redisClient.isReady) {
                const cached = await redisClient.get(key);
                if (cached) {
                    res.set('X-Cache', 'HIT');
                    return res.json(JSON.parse(cached));
                }
            }
        } catch (e) { }

        // Fetch history for the logged-in user, sorted by newest first
        // Populate module details for display
        const history = await TestResult.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('moduleId', 'title')
            .populate('answers.questionId', 'questionText options correctOptionIndex explanation');

        try {
            if (redisClient.isReady) await redisClient.set(key, JSON.stringify(history), { EX: CACHE_EXP });
        } catch (e) { }

        res.set('X-Cache', 'MISS');
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export { submitTestResult, getUserHistory };
