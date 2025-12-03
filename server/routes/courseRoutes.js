import express from 'express';
import { body } from 'express-validator';
import {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
  getCourseStats
} from '../controllers/courseController.js';
import {
  addItem,
  updateItem,
  deleteItem,
  getModuleItems,
  getItem,
  reorderItems,
  bulkAddItems
} from '../controllers/moduleController.js';
import { protect, adminOnly, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Validation middlewares
const createCourseValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
];

const updateCourseValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean value')
];

const moduleValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Module title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

const itemValidation = [
  body('type')
    .isIn(['video', 'document'])
    .withMessage('Type must be either video or document'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Item title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('Item URL is required')
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

// Course routes
router.get('/stats', protect, adminOnly, getCourseStats);
router.post('/', protect, adminOnly, createCourseValidation, createCourse);
router.get('/', optionalAuth, getCourses);
router.get('/:id', optionalAuth, getCourse);
router.put('/:id', protect, adminOnly, updateCourseValidation, updateCourse);
router.delete('/:id', protect, adminOnly, deleteCourse);

// Module routes
router.post('/:id/modules', protect, adminOnly, moduleValidation, addModule);
router.put('/:courseId/modules/:moduleId', protect, adminOnly, moduleValidation, updateModule);
router.delete('/:courseId/modules/:moduleId', protect, adminOnly, deleteModule);

// Item routes
router.post('/:courseId/modules/:moduleId/items', protect, adminOnly, itemValidation, addItem);
router.get('/:courseId/modules/:moduleId/items', optionalAuth, getModuleItems);
router.get('/:courseId/modules/:moduleId/items/:itemId', optionalAuth, getItem);
router.put('/:courseId/modules/:moduleId/items/:itemId', protect, adminOnly, itemValidation, updateItem);
router.delete('/:courseId/modules/:moduleId/items/:itemId', protect, adminOnly, deleteItem);
router.put('/:courseId/modules/:moduleId/items/reorder', protect, adminOnly, reorderItems);
router.post('/:courseId/modules/:moduleId/items/bulk', protect, adminOnly, bulkAddItems);

export default router;