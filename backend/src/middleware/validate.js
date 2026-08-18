/**
 * validate.js — Zod-based validation middleware factory.
 *
 * DESIGN: Takes a Zod schema and returns Express middleware that validates
 * req.body / req.params / req.query. On failure, returns a consistent
 * 400 error response without reaching the controller.
 *
 * Usage:
 *   import { validate } from '../middleware/validate.js';
 *   import { loginSchema } from '../validators/auth.validator.js';
 *   router.post('/login', validate(loginSchema), loginController);
 */

/**
 * @param {import('zod').ZodObject} schema - Zod schema object with optional
 *   `body`, `params`, `query` keys.
 */
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
    });

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.slice(1).join("."), // Remove the top-level key (body/params/query)
            message: issue.message,
        }));

        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Request validation failed",
                details: errors,
            },
        });
    }

    // Overwrite with parsed/coerced values
    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params;
    if (result.data.query) req.query = result.data.query;

    next();
};
