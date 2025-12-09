// Simple in-memory database for local development
class LocalDatabase {
  constructor() {
    this.users = new Map();
    this.readings = new Map();
    this.goals = new Map();
    this.medications = new Map();
  }

  // User operations
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(userId) {
    return this.users.get(userId);
  }

  async createUser(userData) {
    const userId = Date.now().toString();
    const user = {
      _id: userId,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(userId, user);
    return user;
  }

  async updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // BP Readings operations
  async createReading(userId, reading) {
    const readingId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newReading = {
      _id: readingId,
      userId,
      ...reading,
      timestamp: reading.timestamp || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!this.readings.has(userId)) {
      this.readings.set(userId, []);
    }
    this.readings.get(userId).push(newReading);
    return newReading;
  }

  async getReadings(userId, options = {}) {
    const userReadings = this.readings.get(userId) || [];
    let filtered = [...userReadings];

    // Apply date filtering
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      filtered = filtered.filter(r => new Date(r.timestamp) >= startDate);
    }
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      filtered = filtered.filter(r => new Date(r.timestamp) <= endDate);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  async getReadingById(userId, readingId) {
    const userReadings = this.readings.get(userId) || [];
    return userReadings.find(r => r._id === readingId);
  }

  async updateReading(userId, readingId, updates) {
    const userReadings = this.readings.get(userId) || [];
    const index = userReadings.findIndex(r => r._id === readingId);
    
    if (index === -1) return null;

    userReadings[index] = {
      ...userReadings[index],
      ...updates,
      updatedAt: new Date()
    };
    return userReadings[index];
  }

  async deleteReading(userId, readingId) {
    const userReadings = this.readings.get(userId) || [];
    const index = userReadings.findIndex(r => r._id === readingId);
    
    if (index === -1) return false;

    userReadings.splice(index, 1);
    return true;
  }

  // Goal operations
  async createGoal(userId, goalData) {
    const goalId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newGoal = {
      _id: goalId,
      userId,
      ...goalData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!this.goals.has(userId)) {
      this.goals.set(userId, []);
    }
    this.goals.get(userId).push(newGoal);
    return newGoal;
  }

  async getGoals(userId) {
    return this.goals.get(userId) || [];
  }

  async getActiveGoal(userId) {
    const userGoals = this.goals.get(userId) || [];
    return userGoals.find(g => g.active === true) || null;
  }

  async updateGoal(userId, goalId, updates) {
    const userGoals = this.goals.get(userId) || [];
    const index = userGoals.findIndex(g => g._id === goalId);
    
    if (index === -1) return null;

    userGoals[index] = {
      ...userGoals[index],
      ...updates,
      updatedAt: new Date()
    };
    return userGoals[index];
  }

  async deleteGoal(userId, goalId) {
    const userGoals = this.goals.get(userId) || [];
    const index = userGoals.findIndex(g => g._id === goalId);
    
    if (index === -1) return false;

    userGoals.splice(index, 1);
    return true;
  }

  // Medication operations
  async createMedication(userId, medData) {
    const medId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newMed = {
      _id: medId,
      userId,
      ...medData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!this.medications.has(userId)) {
      this.medications.set(userId, []);
    }
    this.medications.get(userId).push(newMed);
    return newMed;
  }

  async getMedications(userId) {
    return this.medications.get(userId) || [];
  }

  async updateMedication(userId, medId, updates) {
    const userMeds = this.medications.get(userId) || [];
    const index = userMeds.findIndex(m => m._id === medId);
    
    if (index === -1) return null;

    userMeds[index] = {
      ...userMeds[index],
      ...updates,
      updatedAt: new Date()
    };
    return userMeds[index];
  }

  async deleteMedication(userId, medId) {
    const userMeds = this.medications.get(userId) || [];
    const index = userMeds.findIndex(m => m._id === medId);
    
    if (index === -1) return false;

    userMeds.splice(index, 1);
    return true;
  }
}

export { LocalDatabase };
