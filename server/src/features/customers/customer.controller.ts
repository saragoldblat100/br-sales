import { Request, Response } from 'express';
import { customerService } from './customer.service';
import { SpecialPrice, Item } from '@/features/items';

export const customerController = {
  /**
   * GET /api/sales/customers/search?q=query
   * Search customers by name
   */
  async searchCustomers(req: Request, res: Response): Promise<void> {
    const query = (req.query.q as string) || '';
    const customers = await customerService.searchCustomers(query);

    res.json({
      success: true,
      customers: customers.map((c) => ({
        _id: c._id.toString(),
        customerCode: c.customerCode,
        customerName: c.customerName,
        phone: c.phone,
        city: c.city,
        balance: c.balance,
      })),
    });
  },

  /**
   * GET /api/sales/customers/:customerCode
   * Get customer details with special prices
   */
  async getCustomerDetails(req: Request, res: Response): Promise<void> {
    const { customerCode } = req.params;
    const customer = await customerService.getCustomerByCode(customerCode);

    if (!customer) {
      res.status(404).json({
        success: false,
        error: { message: 'Customer not found' },
      });
      return;
    }

    // Get special prices for this customer
    const specialPrices = await SpecialPrice.find({ customerCode });

    // Get all item codes that have special prices
    const itemCodes = specialPrices.map((sp) => sp.itemCode);

    // Single query to get all items at once
    const items = await Item.find({ itemCode: { $in: itemCodes } }).populate(
      'categoryId',
      'name nameEn nameHe'
    );

    // Create a map for quick lookup
    const itemMap = new Map<string, typeof items[0]>();
    items.forEach((item) => {
      itemMap.set(item.itemCode, item);
    });

    // Build the response by matching special prices with items
    const itemsWithSpecialPrices = specialPrices
      .map((sp) => {
        const item = itemMap.get(sp.itemCode);
        if (item) {
          return {
            _id: item._id.toString(),
            itemCode: item.itemCode,
            englishDescription: item.englishDescription,
            nameHe: item.nameHe,
            imageUrl: item.imageUrl,
            qtyPerCarton: item.qtyPerCarton,
            boxCBM: item.boxCBM,
            cartonHeight: item.cartonHeight,
            cartonLength: item.cartonLength,
            cartonWidth: item.cartonWidth,
            categoryId: item.categoryId,
            specialPrice: sp.specialPrice,
            specialPriceCurrency: sp.currency,
            hasSpecialPrice: true,
            lastSalesOrderPrice: item.lastSalesOrderPrice,
            lastSalesOrderCurrency: item.lastSalesOrderCurrency,
            lastSalesOrderDate: item.lastSalesOrderDate,
            lastSalesOrderNumber: item.lastSalesOrderNumber,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    // Response format compatible with supplier-price-form
    res.json({
      customer: {
        _id: customer._id.toString(),
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        contactName: customer.contactName,
        customerType: customer.customerType,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        creditLimit: customer.creditLimit,
        balance: customer.balance,
      },
      itemsWithSpecialPrices,
    });
  },

  /**
   * POST /api/sales/customers
   * Create a new customer
   */
  async createCustomer(req: Request, res: Response): Promise<void> {
    const { customerName } = req.body;

    if (!customerName || customerName.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: { message: 'Customer name is required (min 2 characters)' },
      });
      return;
    }

    const customer = await customerService.createCustomer(customerName.trim());

    res.status(201).json({
      success: true,
      customer: {
        _id: customer._id.toString(),
        customerCode: customer.customerCode,
        customerName: customer.customerName,
      },
    });
  },
};
