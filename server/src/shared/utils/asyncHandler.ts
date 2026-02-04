import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async Handler Wrapper
 *
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error handling middleware.
 *
 * Without this wrapper, you'd need try-catch in every async handler:
 * ```ts
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await getUsers();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * ```
 *
 * With asyncHandler:
 * ```ts
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 * ```
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
