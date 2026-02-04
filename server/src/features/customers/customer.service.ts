import { Customer, ICustomer } from './customer.model';
import { createLogger } from '@/shared/utils';

const logger = createLogger('CustomerService');

export const customerService = {
  /**
   * Search customers by name
   */
  async searchCustomers(query: string, limit = 20): Promise<ICustomer[]> {
    logger.debug('Searching customers', { query });

    if (!query || query.length < 2) {
      return [];
    }

    // Support both boolean true and string 'Y' for isActive (SAP compatibility)
    const customers = await Customer.find({
      $and: [
        {
          $or: [
            { customerName: { $regex: query, $options: 'i' } },
            { customerCode: { $regex: query, $options: 'i' } },
          ],
        },
        {
          $or: [
            { isActive: true },
            { isActive: 'Y' },
          ],
        },
      ],
    })
      .limit(limit)
      .sort({ customerName: 1 });

    return customers;
  },

  /**
   * Get customer by code
   */
  async getCustomerByCode(customerCode: string): Promise<ICustomer | null> {
    return Customer.findOne({ customerCode });
  },

  /**
   * Create a new customer (prospect/new visit)
   */
  async createCustomer(customerName: string, agentCode?: string): Promise<ICustomer> {
    logger.info('Creating new customer', { customerName });

    // Generate a temporary customer code
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const customerCode = `NEW-${timestamp}-${random}`.toUpperCase();

    const customer = new Customer({
      customerCode,
      customerName,
      agentCode,
      isActive: true,
    });

    await customer.save();
    logger.info('Customer created', { customerCode, customerName });

    return customer;
  },

  /**
   * Get all customers for an agent
   */
  async getCustomersByAgent(agentCode: string): Promise<ICustomer[]> {
    return Customer.find({
      agentCode,
      $or: [{ isActive: true }, { isActive: 'Y' }],
    }).sort({ customerName: 1 });
  },
};
