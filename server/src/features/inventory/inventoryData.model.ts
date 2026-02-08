import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem {
  itemCode: string;
  itemDescription: string;
  quantity: number;
  color: string;
  pricePerCarton: number;
  soldQuantity: number;
  soldAt?: Date | null;
}

export interface IInventoryData extends Document {
  items: IInventoryItem[];
  totalItems: number;
  uploadedAt: Date;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    itemCode: { type: String, default: '' },
    itemDescription: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    color: { type: String, default: '' },
    pricePerCarton: { type: Number, default: 0 },
    soldQuantity: { type: Number, default: 0 },
    soldAt: { type: Date, default: null },
  },
  { _id: false }
);

const inventoryDataSchema = new Schema<IInventoryData>(
  {
    items: [inventoryItemSchema],
    totalItems: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export const InventoryData = mongoose.model<IInventoryData>(
  'InventoryData',
  inventoryDataSchema
);
