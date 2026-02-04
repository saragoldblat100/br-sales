import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderLine {
  itemId: string;
  itemCode: string;
  description: string;
  quantity: number;
  cartons: number;
  pricePerUnit: number;
  pricePerCarton: number;
  totalPrice: number;
  currency: 'ILS' | 'USD';
  cbm: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  lines: IOrderLine[];
  status: 'draft' | 'quote' | 'order';
  notes?: string;
  totalCBM: number;
  totalAmountILS: number;
  totalAmountUSD: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderLineSchema = new Schema<IOrderLine>(
  {
    itemId: { type: String, required: true },
    itemCode: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    cartons: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    pricePerCarton: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    currency: { type: String, enum: ['ILS', 'USD'], required: true },
    cbm: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true },
    customerId: { type: String, required: true },
    customerCode: { type: String, required: true },
    customerName: { type: String, required: true },
    lines: [orderLineSchema],
    status: {
      type: String,
      enum: ['draft', 'quote', 'order'],
      default: 'draft',
    },
    notes: { type: String },
    totalCBM: { type: Number, default: 0 },
    totalAmountILS: { type: Number, default: 0 },
    totalAmountUSD: { type: Number, default: 0 },
    createdBy: { type: String },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await Order.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.orderNumber = `ORD-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
