/**
 * Seed Users Script
 * Run with: npx ts-node scripts/seed-users.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// User schema (simplified for seeding)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  role: { type: String, enum: ['admin', 'sales_agent', 'manager', 'accountant', 'logistics'], default: 'sales_agent' },
  isActive: { type: Boolean, default: true },
});

// Hash password before saving
import bcrypt from 'bcryptjs';
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

// Users to create
const users = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'מנהל מערכת',
    email: 'admin@bravo.co.il',
    role: 'admin',
  },
  {
    username: 'manager',
    password: 'manager123',
    name: 'שרה גולדבלט',
    email: 'manager@bravo.co.il',
    role: 'manager',
  },
  {
    username: 'accountant',
    password: 'accountant123',
    name: 'מנהלת חשבונות',
    email: 'accountant@bravo.co.il',
    role: 'accountant',
  },
  {
    username: 'sales',
    password: 'sales123',
    name: 'סוכנת מכירות',
    email: 'sales@bravo.co.il',
    role: 'sales_agent',
  },
];

async function seedUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!\n');

    for (const userData of users) {
      const existing = await User.findOne({ username: userData.username });
      if (existing) {
        console.log(`User "${userData.username}" already exists, skipping...`);
      } else {
        await User.create(userData);
        console.log(`Created user: ${userData.username} (${userData.role}) - password: ${userData.password}`);
      }
    }

    console.log('\n=== Users Summary ===');
    console.log('manager    / manager123    - מנהלת (יכולה להעלות קבצים)');
    console.log('accountant / accountant123 - מנה"ח (יכולה להעלות קבצים)');
    console.log('sales      / sales123      - סוכנת (רק צפייה וסימון)');
    console.log('admin      / admin123      - מנהל מערכת');

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedUsers();
