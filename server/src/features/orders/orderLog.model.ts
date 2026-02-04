import mongoose, { Document, Schema } from 'mongoose';

/**
 * Order Log - stores only basic info about sent orders (not full details)
 */
export interface IOrderLog extends Document {
  orderNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  itemsSummary: {
    itemCode: string;
    description: string;
    cartons: number;
    quantity: number;
  }[];
  totalCBM: number;
  totalAmountILS: number;
  totalAmountUSD: number;
  notes?: string;
  sentAt: Date;
  createdBy?: string;
}

const orderLogSchema = new Schema<IOrderLog>(
  {
    orderNumber: { type: String, unique: true },
    customerId: { type: String, required: true },
    customerCode: { type: String, required: true },
    customerName: { type: String, required: true },
    itemsSummary: [{
      itemCode: { type: String },
      description: { type: String },
      cartons: { type: Number },
      quantity: { type: Number },
    }],
    totalCBM: { type: Number, default: 0 },
    totalAmountILS: { type: Number, default: 0 },
    totalAmountUSD: { type: Number, default: 0 },
    notes: { type: String },
    sentAt: { type: Date, default: Date.now },
    createdBy: { type: String },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderLogSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await OrderLog.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.orderNumber = `ORD-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

export const OrderLog = mongoose.model<IOrderLog>('OrderLog', orderLogSchema);
