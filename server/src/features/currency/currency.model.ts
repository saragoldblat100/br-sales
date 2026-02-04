import mongoose, { Schema, Document } from 'mongoose';

export interface ICurrencyRate extends Document {
  date: Date;
  usdRate: number;
  usdRateWithMargin: number;
  marginPercentage: number;
  source: 'manual' | 'api' | 'bank';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const currencyRateSchema = new Schema<ICurrencyRate>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    usdRate: {
      type: Number,
      required: true,
      min: 0,
    },
    usdRateWithMargin: {
      type: Number,
      required: true,
      min: 0,
    },
    marginPercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      enum: ['manual', 'api', 'bank'],
      default: 'bank',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index - one rate per date
currencyRateSchema.index({ date: 1 }, { unique: true });
currencyRateSchema.index({ date: -1 });

// Pre-save hook: Calculate rate with margin
currencyRateSchema.pre('save', function (next) {
  if (this.isModified('usdRate') || this.isModified('marginPercentage')) {
    this.usdRateWithMargin = this.usdRate * (1 + this.marginPercentage / 100);
  }
  next();
});

export const CurrencyRate = mongoose.model<ICurrencyRate>('CurrencyRate', currencyRateSchema);
