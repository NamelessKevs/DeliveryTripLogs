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

    // Trip Logs Table - FIXED: Allow NULL for draft fields
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS trip_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_name TEXT NOT NULL,
        truck_plate TEXT,
        from_location TEXT NOT NULL,
        to_location TEXT,
        start_time TEXT,
        end_time TEXT,
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
    const result = await db.runAsync(
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

// Save as draft (synced = -1)
export const saveDraftTripLog = async (tripLog) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.runAsync(
      `INSERT INTO trip_logs 
        (driver_name, truck_plate, from_location, to_location, start_time, end_time, remarks, created_by, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, -1)`,
      [
        tripLog.driver_name,
        tripLog.truck_plate || null,
        tripLog.from_location || null,
        tripLog.to_location || null,
        tripLog.start_time || null,
        tripLog.end_time || null,
        tripLog.remarks || null,
        tripLog.created_by,
        tripLog.created_at || getLocalTimestamp(),
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Save draft log error:', error);
    throw error;
  }
};

// Update existing trip log
export const updateTripLog = async (id, tripLog) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync(
      `UPDATE trip_logs 
       SET driver_name = ?, truck_plate = ?, from_location = ?, to_location = ?, 
           start_time = ?, end_time = ?, remarks = ?
       WHERE id = ?`,
      [
        tripLog.driver_name,
        tripLog.truck_plate || null,
        tripLog.from_location || null,
        tripLog.to_location || null,
        tripLog.start_time || null,
        tripLog.end_time || null,
        tripLog.remarks || null,
        id,
      ]
    );
  } catch (error) {
    console.error('Update trip log error:', error);
    throw error;
  }
};

// Mark draft as ready to sync (synced = 0)
export const markAsReadyToSync = async (id) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync('UPDATE trip_logs SET synced = 0 WHERE id = ?', [id]);
  } catch (error) {
    console.error('Mark ready to sync error:', error);
    throw error;
  }
};

// Mark trip as synced (synced = 1)
export const markTripAsSynced = async (id) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync('UPDATE trip_logs SET synced = 1 WHERE id = ?', [id]);
  } catch (error) {
    console.error('Mark as synced error:', error);
    throw error;
  }
};

// Get draft trip logs
export const getDraftTripLogs = async () => {
  try {
    const database = ensureDbInitialized();
    const logs = await database.getAllAsync('SELECT * FROM trip_logs WHERE synced = -1');
    return logs;
  } catch (error) {
    console.error('Get draft logs error:', error);
    return [];
  }
};

export const getAllTripLogs = async () => {
  try {
    const logs = await db.getAllAsync('SELECT * FROM trip_logs ORDER BY id DESC');
    return logs;
  } catch (error) {
    console.error('Get all logs error:', error);
    return [];
  }
};

export const getUnsyncedTripLogs = async () => {
  try {
    const logs = await db.getAllAsync('SELECT * FROM trip_logs WHERE synced = 0');
    return logs;
  } catch (error) {
    console.error('Get unsynced logs error:', error);
    return [];
  }
};

export const deleteTripLog = async (id) => {
  try {
    await db.runAsync('DELETE FROM trip_logs WHERE id = ?', [id]);
  } catch (error) {
    console.error('Delete log error:', error);
  }
};

// ---------------------
// Users Functions
// ---------------------
export const registerUser = async (user) => {
  try {
    const result = await db.runAsync(
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
    const result = await db.getAllAsync(
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
    const users = await db.getAllAsync('SELECT * FROM users ORDER BY id DESC');
    return users;
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
};

export const updateUser = async (id, user) => {
  try {
    // Build update query dynamically to handle optional password
    let query = `UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, username = ?`;
    let params = [
      user.first_name,
      user.middle_name || null,
      user.last_name,
      user.username,
    ];

    // Only update password if provided
    if (user.password) {
      query += `, password = ?`;
      params.push(user.password);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await db.runAsync(query, params);
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
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