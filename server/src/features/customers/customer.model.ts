import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;
  customerCode: string;
  customerName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  isActive: boolean | string; // Support both boolean and 'Y'/'N' from SAP
  agentCode?: string;
  creditLimit?: number;
  balance?: number;
  customerType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Schema.Types.Mixed, // Support both Boolean and String ('Y'/'N' from SAP)
      default: true,
    },
    customerType: {
      type: String,
      trim: true,
    },
    agentCode: {
      type: String,
      trim: true,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ customerName: 'text' });
customerSchema.index({ customerCode: 1 });
customerSchema.index({ agentCode: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
