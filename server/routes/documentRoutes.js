import express from 'express';
import { body } from 'express-validator';
import {
  uploadDocument,
  getDocument,
  downloadDocument,
  getDocumentsByCourse,
  updateDocument,
  deleteDocument,
  searchDocuments,
  getDocumentStats
} from '../controllers/documentController.js';
import { summarizeDocument } from '../controllers/aiController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = express.Router();

// Validation middlewares
const uploadDocumentValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  body('moduleId')
    .notEmpty()
    .withMessage('Module ID is required')
    .isMongoId()
    .withMessage('Invalid module ID format'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string')
];

const updateDocumentValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  body('aiSummary')
    .optional()
    .isString()
    .withMessage('AI summary must be a string')
];

const summarizeValidation = [
  body('force')
    .optional()
    .isBoolean()
    .withMessage('Force must be a boolean value'),
  body('provider')
    .optional()
    .isIn(['openai', 'gemini'])
    .withMessage('Provider must be either openai or gemini')
];

// Routes
router.get('/stats', protect, adminOnly, getDocumentStats);
router.get('/search', protect, searchDocuments);
router.post('/upload', protect, adminOnly, uploadSingle('file'), uploadDocumentValidation, uploadDocument);
router.get('/course/:courseId', protect, getDocumentsByCourse);
router.get('/:id', protect, getDocument);
router.get('/:id/download', protect, downloadDocument);
router.post('/:id/summarize', protect, adminOnly, summarizeValidation, summarizeDocument);
router.put('/:id', protect, adminOnly, updateDocumentValidation, updateDocument);
router.delete('/:id', protect, adminOnly, deleteDocument);

export default router;