import mongoose, { Schema, Document } from 'mongoose';

export interface ISpecialPrice extends Document {
  _id: mongoose.Types.ObjectId;
  customerCode: string;
  itemCode: string;
  specialPrice: number;
  currency: 'USD' | 'ILS';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const specialPriceSchema = new Schema<ISpecialPrice>(
  {
    customerCode: {
      type: String,
      required: true,
      trim: true,
    },
    itemCode: {
      type: String,
      required: true,
      trim: true,
    },
    specialPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'ILS'],
      default: 'USD',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup
specialPriceSchema.index({ customerCode: 1, itemCode: 1 }, { unique: true });

export const SpecialPrice = mongoose.model<ISpecialPrice>('SpecialPrice', specialPriceSchema);
