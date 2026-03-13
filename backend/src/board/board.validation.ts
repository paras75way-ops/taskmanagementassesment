import { body } from 'express-validator';

export const createBoardValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Board name is required')
    .isString()
    .withMessage('Board name must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Board name must be between 1 and 50 characters'),
];

export const updateBoardValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Board name cannot be empty if provided')
    .isString()
    .withMessage('Board name must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Board name must be between 1 and 50 characters'),
];
