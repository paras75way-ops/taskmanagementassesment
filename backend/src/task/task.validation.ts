import { body } from "express-validator";

export const createTaskValidation = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isString()
        .withMessage("Title must be a string")
        .isLength({ max: 100 })
        .withMessage("Title must be 100 characters or less"),
    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a string")
        .isLength({ max: 500 })
        .withMessage("Description must be 500 characters or less"),
    body("status")
        .optional()
        .isIn(["todo", "inprogress", "done"])
        .withMessage("Status must be one of: todo, inprogress, done"),
    body("position")
        .notEmpty()
        .withMessage("Position is required")
        .isNumeric()
        .withMessage("Position must be a number"),
    body("targetDate")
        .optional()
        .isString()
        .withMessage("Target date must be a string"),
    body("boardId")
        .trim()
        .notEmpty()
        .withMessage("Board ID is required")
        .isMongoId()
        .withMessage("Board ID must be a valid MongoDB ID"),
];

export const updateTaskValidation = [
    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Title cannot be empty")
        .isString()
        .withMessage("Title must be a string")
        .isLength({ max: 100 })
        .withMessage("Title must be 100 characters or less"),
    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a string")
        .isLength({ max: 500 })
        .withMessage("Description must be 500 characters or less"),
    body("status")
        .optional()
        .isIn(["todo", "inprogress", "done"])
        .withMessage("Status must be one of: todo, inprogress, done"),
    body("position")
        .optional()
        .isNumeric()
        .withMessage("Position must be a number"),
    body("targetDate")
        .optional()
        .isString()
        .withMessage("Target date must be a string"),
    body("boardId")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Board ID cannot be empty if provided")
        .isMongoId()
        .withMessage("Board ID must be a valid MongoDB ID"),
];
