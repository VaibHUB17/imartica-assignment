import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
    });

    // Handle application termination
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
    
    // Additional error information for debugging
    if (error.name === 'MongoNetworkError') {
      console.error('🌐 Network Error: Check your internet connection and MongoDB URI');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('🔍 Server Selection Error: MongoDB server is not reachable');
    } else if (error.name === 'MongoParseError') {
      console.error('📝 Parse Error: Check your MongoDB connection string format');
    }
    
    // Exit process with failure
    process.exit(1);
  }
};

// Function to check database health
export const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[state] || 'unknown',
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

// Function to get database statistics
export const getDBStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const admin = mongoose.connection.db.admin();
    const stats = await admin.serverStatus();
    
    return {
      version: stats.version,
      uptime: stats.uptime,
      connections: stats.connections,
      memory: stats.mem,
      operations: stats.opcounters
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { error: error.message };
  }
};

// Function to close database connection
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