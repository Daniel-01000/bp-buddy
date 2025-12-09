import { LocalDatabase } from './local-database.js';

export class BPDatabase {
  constructor() {
    this.dbName = 'bp_buddy';
    this.collectionsNames = {
      readings: 'bp_readings',
      users: 'users',
      goals: 'bp_goals',
      medications: 'medications'
    };
    this.useLocal = false;
    this.localDb = null;
    this.mongoConnectionFailed = false;
    this.mongoClientPromise = null;
  }

  async getMongoClient() {
    if (!this.mongoClientPromise) {
      // Lazy load mongodb module
      const { default: clientPromise } = await import('./mongodb.js');
      this.mongoClientPromise = clientPromise;
    }
    return this.mongoClientPromise;
  }

  async getDatabase() {
    // Try MongoDB first, fallback to local if it fails
    if (this.mongoConnectionFailed) {
      console.log('📦 Using local database (MongoDB previously failed)');
      return await this.getLocalDb();
    }

    try {
      const clientPromise = await this.getMongoClient();
      const client = await clientPromise;
      const db = client.db(this.dbName);
      console.log('✅ Connected to MongoDB Atlas');
      this.useLocal = false;
      return db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('📦 Falling back to local database');
      this.mongoConnectionFailed = true;
      return await this.getLocalDb();
    }
  }

  async getLocalDb() {
    if (!this.localDb) {
      this.localDb = new LocalDatabase();
    }
    this.useLocal = true;
    return this.localDb;
  }

  // BP Readings CRUD operations
  async createReading(userId, reading) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.readings);
      
      const document = {
        userId,
        systolic: reading.systolic,
        diastolic: reading.diastolic,
        pulse: reading.pulse || null,
        timestamp: reading.timestamp || new Date(),
        notes: reading.notes || '',
        tags: reading.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(document);
      return { ...document, _id: result.insertedId };
    } catch (error) {
      const localDb = await this.getLocalDb();
      return await localDb.createReading(userId, reading);
    }
  }

  async getReadings(userId, options = {}) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.readings);
      
      const query = { userId };
      
      // Add date filtering if provided
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      const cursor = collection.find(query)
        .sort({ timestamp: -1 })
        .limit(options.limit || 100);
      
      return await cursor.toArray();
    } catch (error) {
      const localDb = await this.getLocalDb();
      return await localDb.getReadings(userId, options);
    }
  }

  async updateReading(readingId, updates) {
    const db = await this.getDatabase();
    const collection = db.collection(this.collectionsNames.readings);
    
    const updateDocument = {
      ...updates,
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { _id: readingId },
      { $set: updateDocument }
    );

    return result.modifiedCount > 0;
  }

  async deleteReading(readingId) {
    const db = await this.getDatabase();
    const collection = db.collection(this.collectionsNames.readings);
    
    const result = await collection.deleteOne({ _id: readingId });
    return result.deletedCount > 0;
  }

  // Analytics and insights
  async getReadingStats(userId, days = 30) {
    const db = await this.getDatabase();
    const collection = db.collection(this.collectionsNames.readings);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgSystolic: { $avg: '$systolic' },
          avgDiastolic: { $avg: '$diastolic' },
          maxSystolic: { $max: '$systolic' },
          maxDiastolic: { $max: '$diastolic' },
          minSystolic: { $min: '$systolic' },
          minDiastolic: { $min: '$diastolic' },
          totalReadings: { $sum: 1 },
          avgPulse: { $avg: '$pulse' }
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();
    return result[0] || null;
  }

  async getTrends(userId, groupBy = 'day', days = 30) {
    const db = await this.getDatabase();
    const collection = db.collection(this.collectionsNames.readings);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d-%H';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const pipeline = [
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$timestamp'
            }
          },
          avgSystolic: { $avg: '$systolic' },
          avgDiastolic: { $avg: '$diastolic' },
          avgPulse: { $avg: '$pulse' },
          count: { $sum: 1 },
          date: { $first: '$timestamp' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ];

    return await collection.aggregate(pipeline).toArray();
  }

  // User management
  async createUser(userData) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.users);
      
      const document = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(document);
      return { ...document, _id: result.insertedId };
    } catch (error) {
      const localDb = await this.getLocalDb();
      return await localDb.createUser(userData);
    }
  }

  async getUser(userId) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.users);
      
      return await collection.findOne({ _id: userId });
    } catch (error) {
      const localDb = await this.getLocalDb();
      return await localDb.getUserById(userId);
    }
  }

  // Authentication methods
  async getUserByEmail(email) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.users);
      
      return await collection.findOne({ email: email.toLowerCase() });
    } catch (error) {
      const localDb = await this.getLocalDb();
      return await localDb.getUserByEmail(email.toLowerCase());
    }
  }

  async getUserByUserId(userId) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.users);
      
      return await collection.findOne({ userId });
    } catch (error) {
      const localDb = await this.getLocalDb();
      return await localDb.getUserById(userId);
    }
  }

  async updateUserLastLogin(userId) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.users);
      
      const result = await collection.updateOne(
        { userId },
        { 
          $set: { 
            lastLogin: new Date(),
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      const localDb = await this.getLocalDb();
      const user = await localDb.getUserById(userId);
      if (user) {
        return await localDb.updateUser(userId, { lastLogin: new Date() });
      }
      return false;
    }
  }

  async updateUserProfile(userId, profileUpdates) {
    try {
      const db = await this.getDatabase();
      const collection = db.collection(this.collectionsNames.users);
      
      const result = await collection.findOneAndUpdate(
        { userId },
        { 
          $set: { 
            profile: profileUpdates,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      const localDb = await this.getLocalDb();
      return await localDb.updateUser(userId, { profile: profileUpdates });
    }
  }

  // Legacy method for compatibility
  async getUserProfile(userId) {
    return await this.getUserByUserId(userId);
  }

  async createUserProfile(userId, profile) {
    return await this.createUser({ userId, profile });
  }
}
