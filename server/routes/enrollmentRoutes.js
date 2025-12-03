import express from 'express';
import { body } from 'express-validator';
import {
  enrollInCourse,
  getUserEnrollments,
  updateEnrollmentProgress,
  getEnrollmentDetails,
  cancelEnrollment,
  rateCourse,
  getEnrollmentStats
} from '../controllers/enrollmentController.js';
import { protect, adminOnly, ownerOrAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

const enrollValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID format')
];

const progressUpdateValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  body('isCompleted')
    .isBoolean()
    .withMessage('isCompleted must be a boolean value'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('timeSpent must be a non-negative integer')
];

const ratingValidation = [
  body('score')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating score must be an integer between 1 and 5'),
  body('review')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Review cannot exceed 500 characters')
];

router.get('/stats', protect, adminOnly, getEnrollmentStats);
router.post('/', protect, enrollValidation, enrollInCourse);
router.get('/:userId', protect, ownerOrAdmin, getUserEnrollments);
router.put('/:userId/update', protect, ownerOrAdmin, progressUpdateValidation, updateEnrollmentProgress);
router.get('/:userId/:courseId', protect, ownerOrAdmin, getEnrollmentDetails);
router.put('/:userId/:courseId/cancel', protect, ownerOrAdmin, cancelEnrollment);
router.put('/:userId/:courseId/rate', protect, ratingValidation, rateCourse);

export default router;