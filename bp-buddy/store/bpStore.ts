// Simple store for blood pressure readings
// This ensures data is shared properly between screens

import { getCurrentUser } from './authStore';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Get current user ID from auth store
const getCurrentUserId = (): string => {
  const user = getCurrentUser();
  return user?.userId || 'anonymous';
};

// API helper function with authentication
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const user = getCurrentUser();
  const url = `${API_BASE_URL}/api/${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add authorization header if user is authenticated
  if (user) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Could not get auth token:', error);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
};

export interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  note: string;
  timestamp: Date;
  // Additional fields from backend
  pulse?: number;
  notes?: string;
  tags?: string[];
  _id?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Standalone note interface
export interface Note {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'symptoms' | 'medication' | 'lifestyle' | 'doctor' | 'reminder';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  reminder?: {
    enabled: boolean;
    date: Date;
    recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  };
}

// Streak tracking interface
export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastReadingDate: string | null; // ISO date string
}

// Global storage for readings (in a real app, you'd use AsyncStorage or a database)
let bpReadings: BPReading[] = [];

// Global storage for notes
let notes: Note[] = [];

// Streak data
let streakData: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  lastReadingDate: null,
};

// Event listeners for updates
type UpdateListener = () => void;
const updateListeners: UpdateListener[] = [];

// Helper function to get date string (YYYY-MM-DD format)
const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to calculate streak
const updateStreak = (newReadingDate: Date) => {
  const newDateString = getDateString(newReadingDate);
  const today = getDateString(new Date());
  
  if (!streakData.lastReadingDate) {
    // First reading ever
    streakData.currentStreak = 1;
    streakData.bestStreak = 1;
    streakData.lastReadingDate = newDateString;
  } else {
    const lastDate = new Date(streakData.lastReadingDate);
    const daysDiff = Math.floor((newReadingDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, don't change streak
      return;
    } else if (daysDiff === 1) {
      // Next day, continue streak
      streakData.currentStreak += 1;
      streakData.bestStreak = Math.max(streakData.bestStreak, streakData.currentStreak);
      streakData.lastReadingDate = newDateString;
    } else if (daysDiff > 1) {
      // Gap in readings, reset streak
      streakData.currentStreak = 1;
      streakData.lastReadingDate = newDateString;
    }
    // If daysDiff < 0, it's a backdated reading, don't update streak
  }
  
  console.log('Streak updated:', streakData);
};

// Function to add a new reading
export const addBPReading = async (reading: BPReading) => {
  // Save to API first
  const savedReading = await saveReadingToAPI(reading);
  
  if (savedReading) {
    // Use the reading returned from API (with proper ID, timestamps, etc.)
    bpReadings = [savedReading, ...bpReadings]; // Create new array to trigger updates
    updateStreak(savedReading.timestamp); // Update streak
    
    console.log('Added new reading:', savedReading);
    console.log('Total readings:', bpReadings.length);
    console.log('All readings:', bpReadings.map(r => `${r.systolic}/${r.diastolic}`));
  } else {
    // Fallback to local storage if API fails
    bpReadings = [reading, ...bpReadings]; // Create new array to trigger updates
    updateStreak(reading.timestamp); // Update streak
    console.log('Added reading locally (API failed):', reading);
  }
  
  // Notify all listeners
  updateListeners.forEach(listener => listener());
};

// Function to get all readings
export const getAllBPReadings = (): BPReading[] => {
  return [...bpReadings]; // Return a copy to prevent mutations
};

// Function to get latest reading
export const getLatestBPReading = (): BPReading | null => {
  return bpReadings.length > 0 ? bpReadings[0] : null;
};

// Function to subscribe to updates
export const subscribeToUpdates = (listener: UpdateListener) => {
  updateListeners.push(listener);
  return () => {
    const index = updateListeners.indexOf(listener);
    if (index > -1) {
      updateListeners.splice(index, 1);
    }
  };
};

// Function to get streak data
export const getStreakData = (): StreakData => {
  // Check if we need to reset streak due to missing days
  if (streakData.lastReadingDate) {
    const lastDate = new Date(streakData.lastReadingDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) {
      // More than 1 day gap, reset current streak
      streakData.currentStreak = 0;
    }
  }
  
  return { ...streakData };
};

// Function to get last N readings for AI
export const getLastNReadings = (n: number): BPReading[] => {
  return bpReadings.slice(0, n);
};

// Function to clear all readings (for testing)
export const clearAllBPReadings = () => {
  bpReadings = [];
  streakData = {
    currentStreak: 0,
    bestStreak: 0,
    lastReadingDate: null,
  };
  updateListeners.forEach(listener => listener());
};

// ===== NOTES FUNCTIONS =====

// Function to add a new note
export const addNote = (note: Note) => {
  notes = [note, ...notes]; // Add to beginning (newest first)
  console.log('Added new note:', note.title);
  updateListeners.forEach(listener => listener());
};

// Function to update an existing note
export const updateNote = (noteId: string, updates: Partial<Note>) => {
  const index = notes.findIndex(note => note.id === noteId);
  if (index !== -1) {
    notes[index] = { ...notes[index], ...updates, updatedAt: new Date() };
    notes = [...notes]; // Create new array to trigger updates
    console.log('Updated note:', notes[index].title);
    updateListeners.forEach(listener => listener());
  }
};

// Function to delete a note
export const deleteNote = (noteId: string) => {
  const originalLength = notes.length;
  notes = notes.filter(note => note.id !== noteId);
  if (notes.length < originalLength) {
    console.log('Deleted note:', noteId);
    updateListeners.forEach(listener => listener());
  }
};

// Function to get all notes
export const getAllNotes = (): Note[] => {
  return [...notes]; // Return a copy to prevent mutations
};

// Function to get notes by category
export const getNotesByCategory = (category: Note['category']): Note[] => {
  return notes.filter(note => note.category === category);
};

// Function to get favorite notes
export const getFavoriteNotes = (): Note[] => {
  return notes.filter(note => note.isFavorite);
};

// Function to search notes
export const searchNotes = (query: string): Note[] => {
  const lowercaseQuery = query.toLowerCase();
  return notes.filter(note => 
    note.title.toLowerCase().includes(lowercaseQuery) ||
    note.content.toLowerCase().includes(lowercaseQuery) ||
    note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

// Function to toggle favorite status
export const toggleNoteFavorite = (noteId: string) => {
  const index = notes.findIndex(note => note.id === noteId);
  if (index !== -1) {
    notes[index] = { ...notes[index], isFavorite: !notes[index].isFavorite, updatedAt: new Date() };
    notes = [...notes]; // Create new array to trigger updates
    updateListeners.forEach(listener => listener());
  }
};

// Function to get notes with reminders
export const getNotesWithReminders = (): Note[] => {
  return notes.filter(note => note.reminder?.enabled);
};

// Function to clear all notes (for testing)
export const clearAllNotes = () => {
  notes = [];
  updateListeners.forEach(listener => listener());
};

// API Functions
const fetchReadingsFromAPI = async (): Promise<BPReading[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/readings/${getCurrentUserId()}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      // Convert API data to our format
      return data.data.map((reading: any) => ({
        id: reading._id || reading.id,
        _id: reading._id,
        userId: reading.userId,
        systolic: reading.systolic,
        diastolic: reading.diastolic,
        pulse: reading.pulse,
        note: reading.notes || reading.note || '',
        notes: reading.notes,
        tags: reading.tags || [],
        timestamp: new Date(reading.timestamp),
        createdAt: reading.createdAt ? new Date(reading.createdAt) : undefined,
        updatedAt: reading.updatedAt ? new Date(reading.updatedAt) : undefined,
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch readings from API:', error);
    return [];
  }
};

const saveReadingToAPI = async (reading: BPReading): Promise<BPReading | null> => {
  try {
    const result = await apiCall('readings', {
      method: 'POST',
      body: JSON.stringify({
        userId: getCurrentUserId(),
        reading: {
          systolic: reading.systolic,
          diastolic: reading.diastolic,
          pulse: reading.pulse,
          notes: reading.note,
          tags: reading.tags || [],
          timestamp: reading.timestamp,
        },
      }),
    });
    
    if (result.success && result.data) {
      return {
        ...reading,
        id: result.data._id,
        _id: result.data._id,
        userId: result.data.userId,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to save reading to API:', error);
    return null;
  }
};

// Initialize function to fetch data from API
export const initializeStore = async () => {
  console.log('Initializing store with API data...');
  const apiReadings = await fetchReadingsFromAPI();
  
  if (apiReadings.length > 0) {
    bpReadings = apiReadings.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    console.log(`Loaded ${bpReadings.length} readings from API`);
    
    // Update streak data based on loaded readings
    if (bpReadings.length > 0) {
      // Calculate streak from existing data
      calculateStreakFromExistingData();
    }
    
    // Notify listeners of the loaded data
    updateListeners.forEach(listener => listener());
  } else {
    console.log('No readings found in API, starting with empty store');
  }
};

// Helper function to calculate streak from existing data
const calculateStreakFromExistingData = () => {
  if (bpReadings.length === 0) return;
  
  // Sort readings by date (oldest first for streak calculation)
  const sortedReadings = [...bpReadings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  let currentStreak = 0;
  let bestStreak = 0;
  let lastDate: string | null = null;
  
  // Group readings by date
  const readingsByDate = new Map<string, BPReading[]>();
  sortedReadings.forEach(reading => {
    const dateString = getDateString(reading.timestamp);
    if (!readingsByDate.has(dateString)) {
      readingsByDate.set(dateString, []);
    }
    readingsByDate.get(dateString)!.push(reading);
  });
  
  // Calculate streak
  const uniqueDates = Array.from(readingsByDate.keys()).sort();
  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDate = uniqueDates[i];
    
    if (i === 0) {
      currentStreak = 1;
      bestStreak = 1;
    } else {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(currentDate);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    lastDate = currentDate;
  }
  
  streakData = {
    currentStreak,
    bestStreak,
    lastReadingDate: lastDate,
  };
  
  console.log('Calculated streak from existing data:', streakData);
};

// Function to clear user data (call on logout)
export const clearUserData = () => {
  bpReadings = [];
  notes = [];
  streakData = {
    currentStreak: 0,
    bestStreak: 0,
    lastReadingDate: null,
  };
  
  console.log('User data cleared');
  // Notify all listeners of the update
  updateListeners.forEach(listener => listener());
};

// Function to load user data (call on login/app start)
export const loadUserData = async () => {
  const user = getCurrentUser();
  if (user) {
    console.log('Loading data for user:', user.email);
    await initializeStore();
  } else {
    console.log('No user authenticated, clearing data');
    clearUserData();
  }
};
