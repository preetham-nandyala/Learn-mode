import express from 'express';
import { createModule, getModules, getModuleById, updateModule, deleteModule, addQuestion, deleteQuestion, updateQuestion, bulkAddQuestions, migrateSection } from '../controllers/moduleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getModules) // Users can view
    .post(protect, admin, createModule); // Only admin can create

router.route('/sections/migrate')
    .put(protect, admin, migrateSection);

router.route('/:id')
    .get(protect, getModuleById)
    .put(protect, admin, updateModule)
    .delete(protect, admin, deleteModule);

router.route('/:id/questions')
    .post(protect, admin, addQuestion); // Only admin can add questions

router.route('/:id/questions/:qId')
    .delete(protect, admin, deleteQuestion)
    .put(protect, admin, updateQuestion);

router.route('/:id/questions/bulk')
    .post(protect, admin, bulkAddQuestions);

export default router;
