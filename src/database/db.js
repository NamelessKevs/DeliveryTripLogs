import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db;

// ---------------------
// Database Safety Check
// ---------------------
const ensureDbInitialized = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// ---------------------
// Initialize Database
// ---------------------
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('DeliveryTripLogs.db');

    // Trip Logs Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS trip_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_name TEXT NOT NULL,
        truck_plate TEXT,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        remarks TEXT,
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);

    // Users Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    console.log('Database initialized');
    return db;
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
};

// ---------------------
// Timestamp Helper
// ---------------------
export const getLocalTimestamp = () => {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace('T', ' ');
};

// ---------------------
// Trip Logs Functions
// ---------------------
export const addTripLog = async (tripLog) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.runAsync(
      `INSERT INTO trip_logs 
        (driver_name, truck_plate, from_location, to_location, start_time, end_time, remarks, created_by, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        tripLog.driver_name,
        tripLog.truck_plate || null,
        tripLog.from_location,
        tripLog.to_location,
        tripLog.start_time,
        tripLog.end_time,
        tripLog.remarks || null,
        tripLog.created_by,
        tripLog.created_at || getLocalTimestamp(),
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Add trip log error:', error);
    throw error;
  }
};

export const getAllTripLogs = async () => {
  try {
    const database = ensureDbInitialized();
    const logs = await database.getAllAsync('SELECT * FROM trip_logs ORDER BY id DESC');
    return logs;
  } catch (error) {
    console.error('Get all logs error:', error);
    return [];
  }
};

export const getUnsyncedTripLogs = async () => {
  try {
    const database = ensureDbInitialized();
    const logs = await database.getAllAsync('SELECT * FROM trip_logs WHERE synced = 0');
    return logs;
  } catch (error) {
    console.error('Get unsynced logs error:', error);
    return [];
  }
};

export const deleteTripLog = async (id) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync('DELETE FROM trip_logs WHERE id = ?', [id]);
  } catch (error) {
    console.error('Delete log error:', error);
  }
};

// ---------------------
// Users Functions
// ---------------------
export const registerUser = async (user) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.runAsync(
      `INSERT INTO users (first_name, middle_name, last_name, username, password)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.first_name,
        user.middle_name || null,
        user.last_name,
        user.username,
        user.password, // TODO: Add hashing later
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Register user error:', error);
    throw error;
  }
};

export const loginUser = async (username, password) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.getAllAsync(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Login user error:', error);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const database = ensureDbInitialized();
    const users = await database.getAllAsync('SELECT * FROM users ORDER BY id DESC');
    return users;
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
};

// Add these functions to your db.js in the Users Functions section

export const updateUser = async (id, user) => {
  try {
    const database = ensureDbInitialized();
    
    // Build the update query dynamically based on what fields are provided
    let query = 'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, username = ?';
    let params = [
      user.first_name,
      user.middle_name || null,
      user.last_name,
      user.username,
    ];
    
    // Only update password if it's provided
    if (user.password) {
      query += ', password = ?';
      params.push(user.password);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await database.runAsync(query, params);
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync('DELETE FROM users WHERE id = ?', [id]);
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// ---------------------
// Current User (AsyncStorage)
// ---------------------
export const setCurrentUser = async (user) => {
  try {
    await AsyncStorage.setItem('current_user', JSON.stringify(user));
  } catch (error) {
    console.error('Set current user error:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    const data = await AsyncStorage.getItem('current_user');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('current_user');
  } catch (error) {
    console.error('Logout user error:', error);
  }
};