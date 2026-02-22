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
  status: 'draft' | 'quote' | 'order' | 'pending' | 'approved' | 'deposit_received' | 'closed' | 'cancelled';
  notes?: string;
  totalCBM: number;
  totalAmountILS: number;
  totalAmountUSD: number;
  currency?: 'USD' | 'ILS';
  createdBy?: string;
  createdByName?: string;
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
      enum: ['draft', 'quote', 'order', 'pending', 'approved', 'deposit_received', 'closed', 'cancelled'],
      default: 'draft',
    },
    notes: { type: String },
    totalCBM: { type: Number, default: 0 },
    totalAmountILS: { type: Number, default: 0 },
    totalAmountUSD: { type: Number, default: 0 },
    currency: { type: String, enum: ['USD', 'ILS'] },
    createdBy: { type: String },
    createdByName: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
