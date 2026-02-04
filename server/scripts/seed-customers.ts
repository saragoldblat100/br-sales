import { connectDB, disconnectDB } from '../src/config/db';
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerCode: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  contactName: String,
  phone: String,
  email: String,
  address: String,
  city: String,
  isActive: { type: Boolean, default: true },
  agentCode: String,
  creditLimit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

const sampleCustomers = [
  { customerCode: 'C001', customerName: 'סופר השלושה', city: 'תל אביב', phone: '03-1234567' },
  { customerCode: 'C002', customerName: 'מכולת הזהב', city: 'ירושלים', phone: '02-1234567' },
  { customerCode: 'C003', customerName: 'מרקט פלוס', city: 'חיפה', phone: '04-1234567' },
  { customerCode: 'C004', customerName: 'סופר אושר', city: 'באר שבע', phone: '08-1234567' },
  { customerCode: 'C005', customerName: 'מזון טוב', city: 'רמת גן', phone: '03-7654321' },
  { customerCode: 'C006', customerName: 'השוק הגדול', city: 'פתח תקווה', phone: '03-9876543' },
  { customerCode: 'C007', customerName: 'מינימרקט יוסי', city: 'הרצליה', phone: '09-1234567' },
  { customerCode: 'C008', customerName: 'סופר פרש', city: 'רעננה', phone: '09-7654321' },
  { customerCode: 'C009', customerName: 'מכולת המשפחה', city: 'נתניה', phone: '09-9876543' },
  { customerCode: 'C010', customerName: 'חנות הירקות', city: 'אשדוד', phone: '08-7654321' },
];

async function seedCustomers() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected!');

    console.log('Seeding customers...');

    for (const customerData of sampleCustomers) {
      const existing = await Customer.findOne({ customerCode: customerData.customerCode });
      if (!existing) {
        await Customer.create(customerData);
        console.log(`Created: ${customerData.customerName}`);
      } else {
        console.log(`Skipped (exists): ${customerData.customerName}`);
      }
    }

    console.log('\n✅ Seeding completed!');
    const count = await Customer.countDocuments();
    console.log(`Total customers in database: ${count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await disconnectDB();
  }
}

seedCustomers();
