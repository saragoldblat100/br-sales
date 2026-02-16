import { Router } from 'express';
import { createOrder, getOrders, getOrderById, getDraftOrder, updateOrderStatus, getSentOrders } from './order.controller';
import { authenticate } from '@/shared/middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create new order
router.post('/', createOrder);

// Get draft order for customer
router.get('/draft/:customerId', getDraftOrder);

// Get sent orders from OrderLog
router.get('/sent', getSentOrders);

// Update order status
router.patch('/:id/status', updateOrderStatus);

// Get all orders
router.get('/', getOrders);

// Get single order
router.get('/:id', getOrderById);

export { router as orderRoutes };
