import mongoose, { Schema, Document } from 'mongoose';

export interface ICollectionRecord extends Document {
  caseNumber: string;
  customerName: string;
  collectedAmount: number;
  collectedAt: Date;
  collectedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const collectionRecordSchema = new Schema<ICollectionRecord>(
  {
    caseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    collectedAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    collectedBy: {
      type: String,
      trim: true,
      default: '',
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

// Compound index for unique case per customer
collectionRecordSchema.index({ caseNumber: 1, customerName: 1 }, { unique: true });

export const CollectionRecord = mongoose.model<ICollectionRecord>(
  'CollectionRecord',
  collectionRecordSchema
);
