import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  _id: mongoose.Types.ObjectId;
  itemCode: string;
  barcode?: string;
  englishDescription: string;
  nameHe?: string;
  category?: string;
  categoryId?: mongoose.Types.ObjectId;
  cartonWidth?: number;
  cartonLength?: number;
  cartonHeight?: number;
  qtyPerCarton: number;
  unitWeight?: number;
  boxCBM?: number;
  isActive: boolean;
  supplierPrice?: number;
  supplierCurrency?: string;
  supplierCode?: string;
  lastPurchaseDate?: Date;
  lastPurchaseOrderNumber?: string;
  lastPurchasePrice?: number;
  lastPurchaseCurrency?: string;
  lastSalesOrderPrice?: number;
  lastSalesOrderCurrency?: string;
  lastSalesOrderNumber?: string;
  lastSalesOrderDate?: Date;
  lastInvoicePrice?: number;
  lastInvoiceCurrency?: string;
  lastInvoiceNumber?: string;
  lastInvoiceDate?: Date;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
    },
    englishDescription: {
      type: String,
      required: true,
      trim: true,
    },
    nameHe: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    cartonWidth: {
      type: Number,
      default: 0,
    },
    cartonLength: {
      type: Number,
      default: 0,
    },
    cartonHeight: {
      type: Number,
      default: 0,
    },
    qtyPerCarton: {
      type: Number,
      required: true,
      default: 1,
    },
    unitWeight: {
      type: Number,
      default: 0,
    },
    boxCBM: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    supplierPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplierCurrency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    supplierCode: {
      type: String,
      trim: true,
      default: '',
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
    lastPurchaseOrderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    lastPurchasePrice: {
      type: Number,
      default: 0,
    },
    lastPurchaseCurrency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    lastSalesOrderPrice: {
      type: Number,
      default: 0,
    },
    lastSalesOrderCurrency: {
      type: String,
      default: 'ILS',
      trim: true,
    },
    lastSalesOrderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    lastSalesOrderDate: {
      type: Date,
      default: null,
    },
    lastInvoicePrice: {
      type: Number,
      default: 0,
    },
    lastInvoiceCurrency: {
      type: String,
      default: 'ILS',
      trim: true,
    },
    lastInvoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    lastInvoiceDate: {
      type: Date,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
itemSchema.index({ itemCode: 1 });
itemSchema.index({ barcode: 1 });
itemSchema.index({ categoryId: 1 });
itemSchema.index({ isActive: 1 });

export const Item = mongoose.model<IItem>('Item', itemSchema);
