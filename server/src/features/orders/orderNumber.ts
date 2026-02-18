import mongoose, { Schema, Document } from 'mongoose';
import { Order } from './order.model';
import { OrderLog } from './orderLog.model';

interface IOrderCounter extends Document {
  key: string;
  seq: number;
}

const orderCounterSchema = new Schema<IOrderCounter>({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});

const OrderCounter =
  mongoose.models.OrderCounter ||
  mongoose.model<IOrderCounter>('OrderCounter', orderCounterSchema);

export async function getNextOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const key = `${year}${month}`;
  const prefix = `ORD-${year}${month}-`;

  const getMaxSeq = async () => {
    const [latestOrder, latestLog] = await Promise.all([
      Order.findOne({ orderNumber: { $regex: `^${prefix}` } })
        .sort({ orderNumber: -1 })
        .select('orderNumber')
        .lean(),
      OrderLog.findOne({ orderNumber: { $regex: `^${prefix}` } })
        .sort({ orderNumber: -1 })
        .select('orderNumber')
        .lean(),
    ]);

    const extractSeq = (orderNumber?: string) => {
      if (!orderNumber) return 0;
      const parts = orderNumber.split('-');
      const seqPart = parts[2];
      const seqNum = Number.parseInt(seqPart, 10);
      return Number.isFinite(seqNum) ? seqNum : 0;
    };

    return Math.max(
      extractSeq(latestOrder?.orderNumber),
      extractSeq(latestLog?.orderNumber)
    );
  };

  const maxSeq = await getMaxSeq();

  let counter = await OrderCounter.findOne({ key });
  if (!counter) {
    counter = await OrderCounter.create({ key, seq: maxSeq });
  } else if (counter.seq < maxSeq) {
    counter.seq = maxSeq;
    await counter.save();
  }

  counter = await OrderCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true }
  );

  if (!counter) {
    const fallbackSeq = (maxSeq + 1).toString().padStart(4, '0');
    return `ORD-${year}${month}-${fallbackSeq}`;
  }

  const seq = counter.seq.toString().padStart(4, '0');
  return `ORD-${year}${month}-${seq}`;
}
