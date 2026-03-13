import { body, query } from "express-validator";

export const getActivitiesValidation = [
    query("boardId")
        .trim()
        .notEmpty()
        .withMessage("boardId query parameter is required")
        .isMongoId()
        .withMessage("boardId must be a valid MongoDB ID"),
];

export const createActivityValidation = [
    body("boardId")
        .trim()
        .notEmpty()
        .withMessage("Board ID is required")
        .isMongoId()
        .withMessage("Board ID must be a valid MongoDB ID"),
    body("taskId")
        .trim()
        .notEmpty()
        .withMessage("Task ID is required")
        .isString()
        .withMessage("Task ID must be a string"),
    body("taskTitle")
        .trim()
        .notEmpty()
        .withMessage("Task title is required")
        .isString()
        .withMessage("Task title must be a string"),
    body("action")
        .notEmpty()
        .withMessage("Action is required")
        .isIn(['create', 'update', 'move', 'delete', 'dependency_add', 'dependency_remove'])
        .withMessage("Invalid action type"),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required")
        .isString()
        .withMessage("Description must be a string"),
    body("snapshot")
        .optional()
        .isObject()
        .withMessage("Snapshot must be an object"),
];
