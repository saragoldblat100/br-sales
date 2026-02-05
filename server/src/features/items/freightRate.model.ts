import mongoose, { Schema, Document } from 'mongoose';

export interface IFreightRate extends Document {
  portOfOrigin: string;
  containerSizeCBM: number;
  freightCost: number;
  validFrom: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const freightRateSchema = new Schema<IFreightRate>(
  {
    portOfOrigin: {
      type: String,
      required: true,
      trim: true,
      default: 'Shenzhen Yantian',
    },
    containerSizeCBM: {
      type: Number,
      required: true,
      enum: [33, 57, 68],
      default: 68,
    },
    freightCost: {
      type: Number,
      required: true,
      min: 0,
      default: 4700,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
freightRateSchema.index({ portOfOrigin: 1, containerSizeCBM: 1, validFrom: -1 });
freightRateSchema.index({ isActive: 1 });

// Static method: Get current freight rate
freightRateSchema.statics.getCurrentRate = async function (
  portOfOrigin: string = 'Shenzhen Yantian',
  containerSizeCBM: number = 68
): Promise<IFreightRate | null> {
  return this.findOne({
    portOfOrigin,
    containerSizeCBM,
    isActive: true,
  }).sort({ validFrom: -1 });
};

export const FreightRate = mongoose.model<IFreightRate>('FreightRate', freightRateSchema);
