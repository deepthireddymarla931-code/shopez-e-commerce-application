const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env variables to ensure MONGODB_URI check works during import
dotenv.config();

const dbUri = process.env.MONGODB_URI;

// Perform cache override immediately on load if no URI is provided
if (!dbUri) {
  console.log('No MONGODB_URI found in environment. Intercepting require cache for mock Mongoose...');
  const mockMongoose = require('./mongoose-mock');
  const mongoosePath = require.resolve('mongoose');
  require.cache[mongoosePath] = {
    id: mongoosePath,
    filename: mongoosePath,
    loaded: true,
    exports: mockMongoose
  };
}

const connectDB = async () => {
  try {
    if (!dbUri) {
      const mockMongoose = require('./mongoose-mock');
      const conn = await mockMongoose.connect();
      console.log(`Mock Database Connected: ${conn.connection.host}`);
      return;
    }

    const conn = await mongoose.connect(dbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    if (!dbUri) {
      const mockMongoose = require('./mongoose-mock');
      await mockMongoose.disconnect();
      return;
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error(`Error disconnecting database: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
