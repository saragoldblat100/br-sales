import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@/shared/errors';

/**
 * Validation middleware factory
 *
 * Creates a middleware that validates request data against a Zod schema.
 * Can validate body, query, and/or params.
 *
 * Usage:
 * ```ts
 * router.post('/users', validate({ body: createUserSchema }), createUser);
 * router.get('/users', validate({ query: userFiltersSchema }), getUsers);
 * router.get('/users/:id', validate({ params: z.object({ id: objectIdSchema }) }), getUser);
 * ```
 */
interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query if schema provided
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate params if schema provided
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable object
        const details = error.errors.reduce(
          (acc, err) => {
            const path = err.path.join('.');
            acc[path] = err.message;
            return acc;
          },
          {} as Record<string, string>
        );

        next(AppError.validation('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Shorthand for body-only validation
 */
export const validateBody = (schema: ZodSchema) => validate({ body: schema });

/**
 * Shorthand for query-only validation
 */
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });

/**
 * Shorthand for params-only validation
 */
export const validateParams = (schema: ZodSchema) => validate({ params: schema });
