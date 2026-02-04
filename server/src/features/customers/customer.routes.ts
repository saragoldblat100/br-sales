import { Router } from 'express';
import { customerController } from './customer.controller';
import { authenticate } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/sales/customers/search?q=query
 * Search customers
 */
router.get('/search', asyncHandler(customerController.searchCustomers));

/**
 * GET /api/sales/customers/:customerCode
 * Get customer details
 */
router.get('/:customerCode', asyncHandler(customerController.getCustomerDetails));

/**
 * POST /api/sales/customers
 * Create new customer
 */
router.post('/', asyncHandler(customerController.createCustomer));

export default router;
