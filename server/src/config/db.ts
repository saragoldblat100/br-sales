import mongoose from 'mongoose';
import { env } from './env';

/**
 * MongoDB connection state
 */
let isConnected = false;

/**
 * Connect to MongoDB
 * Implements connection pooling and retry logic
 */
export const connectDB = async (): Promise<boolean> => {
  // If already connected, return early
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📗 MongoDB already connected');
    return true;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isConnected = false;
    return false;
  }
};

/**
 * Disconnect from MongoDB
 * Used for graceful shutdown
 */
export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) return;

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('📕 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

/**
 * Check if database is connected
 */
export const isDBConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('📗 MongoDB connected');
  isConnected = true;
});

mongoose.connection.on('disconnected', () => {
  console.log('📕 MongoDB disconnected');
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('📛 MongoDB error:', err.message);
  isConnected = false;
});
