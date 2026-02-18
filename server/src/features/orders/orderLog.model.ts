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
  createdByName?: string;
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
    createdByName: { type: String },
  },
  {
    timestamps: true,
  }
);

export const OrderLog = mongoose.model<IOrderLog>('OrderLog', orderLogSchema);
