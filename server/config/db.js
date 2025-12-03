import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    

    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
    });

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🛑 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

export default connectDB;