import mongoose, { Schema, Document } from 'mongoose';

export type ActivityEventType =
  | 'login'
  | 'logout'
  | 'collection_mark'
  | 'inventory_sold'
  | 'order_create'
  | 'customer_view'
  | 'item_view';

export interface IActivityLog extends Document {
  userId: string;
  username: string;
  eventType: ActivityEventType;
  eventData: Record<string, any>;
  dateIsrael: string; // YYYY-MM-DD in Israel timezone
  timestamp: Date;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'collection_mark', 'inventory_sold', 'order_create', 'customer_view', 'item_view'],
    },
    eventData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    dateIsrael: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ userId: 1, dateIsrael: 1 });

export const ActivityLog = mongoose.model<IActivityLog>(
  'ActivityLog',
  activityLogSchema
);
