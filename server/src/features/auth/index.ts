/**
 * Auth Feature Module
 *
 * Exports:
 * - Routes
 * - Model
 * - Service (for use in other features)
 */
export { default as authRoutes } from './auth.routes';
export { User, type IUser } from './auth.model';
export { authService } from './auth.service';
