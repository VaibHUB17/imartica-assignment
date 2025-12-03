import express from 'express';
import { body } from 'express-validator';
import {
  summarizeDocument,
  batchSummarizeDocuments,
  getAIStatus
} from '../controllers/aiController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

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

const batchSummarizeValidation = [
  body('documentIds')
    .isArray({ min: 1 })
    .withMessage('Document IDs must be a non-empty array'),
  body('documentIds.*')
    .isMongoId()
    .withMessage('Each document ID must be a valid MongoDB ObjectId'),
  body('provider')
    .optional()
    .isIn(['openai', 'gemini'])
    .withMessage('Provider must be either openai or gemini'),
  body('force')
    .optional()
    .isBoolean()
    .withMessage('Force must be a boolean value')
];

router.get('/status', protect, adminOnly, getAIStatus);
router.post('/summarize-batch', protect, adminOnly, batchSummarizeValidation, batchSummarizeDocuments);

export default router;