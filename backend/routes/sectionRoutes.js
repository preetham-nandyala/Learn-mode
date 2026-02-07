import express from 'express';
import { getSections, createSection, updateSection, deleteSection, migrateLegacySections } from '../controllers/sectionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getSections)
    .post(protect, admin, createSection);

router.route('/:id')
    .put(protect, admin, updateSection)
    .delete(protect, admin, deleteSection);

router.route('/migrate')
    .post(protect, admin, migrateLegacySections);

export default router;
