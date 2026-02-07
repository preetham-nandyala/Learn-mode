import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { submitTestResult, getUserHistory } from '../controllers/testResultController.js';

const router = express.Router();

router.post('/', protect, submitTestResult);
router.get('/history', protect, getUserHistory);

export default router;
