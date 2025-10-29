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

    console.log('🚀 Refreshing database tables...');

    // Drop all existing tables (force recreate)
    await db.execAsync(`
      DROP TABLE IF EXISTS cached_deliveries;
      DROP TABLE IF EXISTS trip_logs;
      DROP TABLE IF EXISTS users;
    `);

    // Recreate tables fresh
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dlf_code TEXT UNIQUE NOT NULL,
        driver TEXT NOT NULL,
        helper TEXT,
        plate_no TEXT,
        trip_count TEXT,
        delivery_date TEXT NOT NULL,
        customers_json TEXT NOT NULL,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_expense_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_type TEXT UNIQUE NOT NULL,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS delivery_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dlf_code TEXT NOT NULL,
        expense_type TEXT NOT NULL,
        amount TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS trip_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dlf_code TEXT NOT NULL,
        driver TEXT NOT NULL,
        helper TEXT,
        plate_no TEXT,
        trip_count TEXT,
        company_departure TEXT,
        company_arrival TEXT,
        dr_no TEXT,
        plant_odo_departure TEXT,
        plant_odo_arrival TEXT,
        si_no TEXT,
        drop_number INTEGER NOT NULL,
        customer TEXT,
        address TEXT,
        customer_arrival TEXT,
        customer_departure TEXT,
        remarks TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'no'
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        position TEXT DEFAULT 'Driver'
      );
    `);

    console.log('✅ Database fully reset and recreated!');
    return db;
  } catch (error) {
    console.error('❌ Database init error:', error);
    throw error;
  }
};

//comment this later
export const seedTestUser = async () => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync(
      `INSERT OR IGNORE INTO users (first_name, middle_name, last_name, username, password, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Erwin', 'Moya', 'Flores', 'test', 'test', 'Driver']
    );
    console.log('Test user seeded');
  } catch (error) {
    console.error('Seed user error:', error);
  }
};

// ---------------------
// Timestamp Helper
// ---------------------
  export const getLocalTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

// ---------------------
// Trip Logs Functions
// ---------------------
export const addTripLog = async (tripLog) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.runAsync(
      `INSERT INTO trip_logs 
        (dlf_code, driver, helper, plate_no, trip_count, 
         company_departure, company_arrival, dr_no, plant_odo_departure, plant_odo_arrival, si_no, drop_number, customer, address, 
         customer_arrival, customer_departure, remarks, created_by, created_at, synced, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tripLog.dlf_code,
        tripLog.driver,
        tripLog.helper || null,
        tripLog.plate_no || null,
        tripLog.trip_count || null,
        tripLog.company_departure || null,
        tripLog.company_arrival || null,
        tripLog.dr_no || null,
        tripLog.plant_odo_departure || null,
        tripLog.plant_odo_arrival || null,
        tripLog.si_no || null,
        tripLog.drop_number,
        tripLog.customer || null,
        tripLog.address || null,
        tripLog.customer_arrival || null,
        tripLog.customer_departure || null,
        tripLog.remarks || null,
        tripLog.created_by,
        tripLog.created_at || getLocalTimestamp(),
        tripLog.synced || 0,
        tripLog.sync_status || 'no',
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Add trip log error:', error);
    throw error;
  }
};

// Update existing trip log
export const updateTripLog = async (id, tripLog) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync(
      `UPDATE trip_logs 
       SET dlf_code = ?, driver = ?, helper = ?, plate_no = ?, trip_count = ?, company_departure = ?, company_arrival = ?,
           dr_no = ?, plant_odo_departure = ?, plant_odo_arrival = ?, si_no = ?, drop_number = ?,
           customer = ?, address = ?, customer_arrival = ?, customer_departure = ?, remarks = ?, synced = ?, sync_status = ?
       WHERE id = ?`,
      [
        tripLog.dlf_code,
        tripLog.driver,
        tripLog.helper || null,
        tripLog.plate_no || null,
        tripLog.trip_count || null,
        tripLog.company_departure || null,
        tripLog.company_arrival || null,
        tripLog.dr_no || null,
        tripLog.plant_odo_departure || null,
        tripLog.plant_odo_arrival || null,
        tripLog.si_no || null,
        tripLog.drop_number,
        tripLog.customer || null,
        tripLog.address || null,
        tripLog.customer_arrival || null,
        tripLog.customer_departure || null,
        tripLog.remarks || null,
        tripLog.synced,
        tripLog.sync_status || 'no',
        id,
      ]
    );
  } catch (error) {
    console.error('Update trip log error:', error);
    throw error;
  }
};

// Get all drops for a specific dlf_code
export const getTripLogsByDeliveryId = async (deliveryId) => {
  try {
    const database = ensureDbInitialized();
    const logs = await database.getAllAsync(
      'SELECT * FROM trip_logs WHERE dlf_code = ? ORDER BY drop_number ASC',
      [deliveryId]
    );
    return logs;
  } catch (error) {
    console.error('Get trip logs by delivery ID error:', error);
    return [];
  }
};

// Update company times for all drops in a delivery
export const updateCompanyTimes = async (deliveryId, companyDeparture, companyArrival) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync(
      `UPDATE trip_logs 
       SET company_departure = ?, company_arrival = ?
       WHERE dlf_code = ?`,
      [companyDeparture, companyArrival, deliveryId]
    );
  } catch (error) {
    console.error('Update company times error:', error);
    throw error;
  }
};

// Get next drop number for a delivery
export const getNextDropNumber = async (deliveryId) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.getAllAsync(
      'SELECT MAX(drop_number) as max_drop FROM trip_logs WHERE dlf_code = ?',
      [deliveryId]
    );
    return (result[0]?.max_drop || 0) + 1;
  } catch (error) {
    console.error('Get next drop number error:', error);
    return 1;
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
    const logs = await db.getAllAsync(
      'SELECT * FROM trip_logs WHERE synced = 0 AND drop_number > 0'
    );
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
// Delivery Expenses Functions
// ---------------------
export const addExpense = async (expense) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.runAsync(
      `INSERT INTO delivery_expenses 
        (dlf_code, expense_type, amount, created_at)
       VALUES (?, ?, ?, ?)`,
      [
        expense.dlf_code,
        expense.expense_type,
        expense.amount,
        expense.created_at || getLocalTimestamp(),
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Add expense error:', error);
    throw error;
  }
};

export const getExpensesByDeliveryId = async (deliveryId) => {
  try {
    const database = ensureDbInitialized();
    const expenses = await database.getAllAsync(
      'SELECT * FROM delivery_expenses WHERE dlf_code = ? ORDER BY id ASC',
      [deliveryId]
    );
    return expenses.map(exp => ({
      id: exp.id,
      type: exp.expense_type,
      amount: parseFloat(exp.amount),
    }));
  } catch (error) {
    console.error('Get expenses by delivery ID error:', error);
    return [];
  }
};

export const deleteExpense = async (id) => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync('DELETE FROM delivery_expenses WHERE id = ?', [id]);
  } catch (error) {
    console.error('Delete expense error:', error);
    throw error;
  }
};

// ---------------------
// Cached Expense Types Functions
// ---------------------
export const saveCachedExpenseTypes = async (expenseTypes) => {
  try {
    const database = ensureDbInitialized();
    
    for (const type of expenseTypes) {
      await database.runAsync(
        `INSERT OR REPLACE INTO cached_expense_types 
          (expense_type, cached_at)
         VALUES (?, ?)`,
        [type, getLocalTimestamp()]
      );
    }
  } catch (error) {
    console.error('Save cached expense types error:', error);
    throw error;
  }
};

export const getCachedExpenseTypes = async () => {
  try {
    const database = ensureDbInitialized();
    const types = await database.getAllAsync(
      'SELECT expense_type FROM cached_expense_types ORDER BY expense_type ASC'
    );
    return types.map(t => t.expense_type);
  } catch (error) {
    console.error('Get cached expense types error:', error);
    return [];
  }
};

// ---------------------
// Cached Deliveries Functions
// ---------------------
export const saveCachedDelivery = async (delivery) => {
  try {
    const database = ensureDbInitialized();
    
    const deliveryDate = delivery.delivery_date || delivery.dlf_code.split('-').slice(0, 3).join('-');
    
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_deliveries 
        (dlf_code, driver, helper, plate_no, trip_count, delivery_date, customers_json, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        delivery.dlf_code,
        delivery.driver,
        delivery.helper || null,
        delivery.plate_no || null,
        delivery.trip_count || null,
        deliveryDate,
        JSON.stringify(delivery.customers || []),
        getLocalTimestamp(),
      ]
    );
  } catch (error) {
    console.error('Save cached delivery error:', error);
    throw error;
  }
};

export const getCachedDeliveries = async () => {
  try {
    const database = ensureDbInitialized();
    
    // Get date range (yesterday, today, tomorrow)
    const today = new Date();

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayDate = formatDate(today);
    
    const deliveries = await database.getAllAsync(
      `SELECT * FROM cached_deliveries 
       WHERE delivery_date = ?
       ORDER BY dlf_code DESC`,
      [todayDate]
    );
    
    // Parse customers_json back to array
    return deliveries.map(d => ({
      ...d,
      customers: JSON.parse(d.customers_json || '[]'),
    }));
  } catch (error) {
    console.error('Get cached deliveries error:', error);
    return [];
  }
};

export const getCachedDeliveryById = async (deliveryId) => {
  try {
    const database = ensureDbInitialized();
    const result = await database.getAllAsync(
      'SELECT * FROM cached_deliveries WHERE dlf_code = ?',
      [deliveryId]
    );
    
    if (result.length > 0) {
      return {
        ...result[0],
        customers: JSON.parse(result[0].customers_json || '[]'),
      };
    }
    return null;
  } catch (error) {
    console.error('Get cached delivery by ID error:', error);
    return null;
  }
};

export const clearCachedDeliveries = async () => {
  try {
    const database = ensureDbInitialized();
    await database.runAsync('DELETE FROM cached_deliveries');
  } catch (error) {
    console.error('Clear cached deliveries error:', error);
  }
};

// ---------------------
// Users Functions
// ---------------------
export const registerUser = async (user) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO users (first_name, middle_name, last_name, username, password, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.first_name,
        user.middle_name || null,
        user.last_name,
        user.username,
        user.password, // TODO: Add hashing later
        user.position || 'Driver',
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
    let query = `UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, username = ?, position = ?`;
    let params = [
      user.first_name,
      user.middle_name || null,
      user.last_name,
      user.username,
      user.position || 'Driver',
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