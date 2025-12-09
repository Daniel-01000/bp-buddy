import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  // Simplified options to fix SSL/TLS errors
  retryWrites: true,
  w: 'majority',
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not found in environment variables');
  // Create a rejected promise that can be caught
  clientPromise = Promise.reject(new Error('MongoDB URI not configured'));
} else {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
