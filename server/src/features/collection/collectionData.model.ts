import mongoose, { Schema, Document } from 'mongoose';

export interface ICollectionItem {
  itemCode: string;
  itemDescription: string;
  quantity: number;
  currency: string;
  pricePerUnit: number;
  rowTotal: number;
  totalWithVAT: number;
}

export interface ICollectionCase {
  caseNumber: string;
  orderNumber: string;
  deliveryNoteNumber: string;
  expectedArrivalDate: Date | null;
  items: ICollectionItem[];
  caseTotal: number;
  caseTotalWithVAT: number;
}

export interface ICollectionData extends Document {
  customerName: string;
  cases: ICollectionCase[];
  totalAmount: number;
  totalWithVAT: number;
  earliestDate: Date | null;
  uploadedAt: Date;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const collectionItemSchema = new Schema<ICollectionItem>(
  {
    itemCode: { type: String, default: '' },
    itemDescription: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    currency: { type: String, default: 'ILS' },
    pricePerUnit: { type: Number, default: 0 },
    rowTotal: { type: Number, default: 0 },
    totalWithVAT: { type: Number, default: 0 },
  },
  { _id: false }
);

const collectionCaseSchema = new Schema<ICollectionCase>(
  {
    caseNumber: { type: String, default: '' },
    orderNumber: { type: String, default: '' },
    deliveryNoteNumber: { type: String, default: '' },
    expectedArrivalDate: { type: Date, default: null },
    items: [collectionItemSchema],
    caseTotal: { type: Number, default: 0 },
    caseTotalWithVAT: { type: Number, default: 0 },
  },
  { _id: false }
);

const collectionDataSchema = new Schema<ICollectionData>(
  {
    customerName: {
      type: String,
      default: '',
      trim: true,
    },
    cases: [collectionCaseSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    totalWithVAT: {
      type: Number,
      default: 0,
    },
    earliestDate: {
      type: Date,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
collectionDataSchema.index({ customerName: 1 });

export const CollectionData = mongoose.model<ICollectionData>(
  'CollectionData',
  collectionDataSchema
);
