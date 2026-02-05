import mongoose, { Schema, Document } from 'mongoose';

export interface IMarginRule extends Document {
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  marginPercentage: number;
  validFrom: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const marginRuleSchema = new Schema<IMarginRule>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: {
      type: String,
      trim: true,
      default: '',
    },
    marginPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 25,
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
marginRuleSchema.index({ categoryId: 1, validFrom: -1 });
marginRuleSchema.index({ isActive: 1 });

// Static method: Get margin for category
marginRuleSchema.statics.getMarginForCategory = async function (
  categoryId: mongoose.Types.ObjectId | string
): Promise<number> {
  const rule = await this.findOne({
    categoryId,
    isActive: true,
  }).sort({ validFrom: -1 });

  return rule ? rule.marginPercentage : 25; // Default 25% if not found
};

// Static method: Get margin history for category
marginRuleSchema.statics.getMarginHistory = async function (
  categoryId: mongoose.Types.ObjectId | string
): Promise<IMarginRule[]> {
  return this.find({
    categoryId,
    isActive: true,
  }).sort({ validFrom: -1 });
};

export const MarginRule = mongoose.model<IMarginRule>('MarginRule', marginRuleSchema);
