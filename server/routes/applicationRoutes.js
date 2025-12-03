import express from 'express';
import { body } from 'express-validator';
import {
  submitApplication,
  getApplications,
  getApplication,
  updateApplicationStatus,
  getApplicationStats,
  deleteApplication,

} from '../controllers/applicationController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

const submitApplicationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('courseApplied')
    .trim()
    .notEmpty()
    .withMessage('Course selection is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Course name must be between 2 and 200 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  body('source')
    .optional()
    .isIn(['website', 'social_media', 'referral', 'advertisement', 'other'])
    .withMessage('Invalid source value'),
  body('marketingConsent')
    .optional()
    .isBoolean()
    .withMessage('Marketing consent must be a boolean value'),
  body('utmSource')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('UTM source cannot exceed 100 characters'),
  body('utmMedium')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('UTM medium cannot exceed 100 characters'),
  body('utmCampaign')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('UTM campaign cannot exceed 100 characters')
];

const updateStatusValidation = [
  body('status')
    .isIn(['pending', 'contacted', 'enrolled', 'rejected', 'follow_up'])
    .withMessage('Invalid status value'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high')
];

const followUpValidation = [
  body('followUpDate')
    .isISO8601()
    .withMessage('Follow-up date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Follow-up date must be in the future');
      }
      return true;
    }),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const bulkUpdateValidation = [
  body('applicationIds')
    .isArray({ min: 1 })
    .withMessage('Application IDs must be a non-empty array'),
  body('applicationIds.*')
    .isMongoId()
    .withMessage('Each application ID must be a valid MongoDB ObjectId'),
  body('updates')
    .isObject()
    .withMessage('Updates must be an object'),
  body('updates.status')
    .optional()
    .isIn(['pending', 'contacted', 'enrolled', 'rejected', 'follow_up'])
    .withMessage('Invalid status value'),
  body('updates.priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('updates.notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
];

router.post('/', submitApplicationValidation, submitApplication);

router.get('/stats', protect, adminOnly, getApplicationStats);
router.get('/', protect, adminOnly, getApplications);
router.get('/:id', protect, adminOnly, getApplication);
router.put('/:id/status', protect, adminOnly, updateStatusValidation, updateApplicationStatus);
router.delete('/:id', protect, adminOnly, deleteApplication);

export default router;