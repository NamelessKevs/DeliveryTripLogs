import * as SQLite from 'expo-sqlite';
import { setDb } from './helpers';

// ---------------------
// Initialize Database
// ---------------------
export const initDatabase = async () => {
  try {
    const database = await SQLite.openDatabaseAsync('DeliveryTripLogs.db');
    setDb(database); // Set db instance in helpers

    console.log('🚀 Starting Application...');

    // Drop all existing tables (force recreate)
    await database.execAsync(`
      DROP TABLE IF EXISTS cached_deliveries;
      DROP TABLE IF EXISTS trip_logs;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS truck_fuel_monitoring;
      DROP TABLE IF EXISTS cached_trucks;
      DROP TABLE IF EXISTS cached_expense_types;
      DROP TABLE IF EXISTS delivery_expenses;
      DROP TABLE IF EXISTS saved_payees;
    `);

    // Recreate tables fresh
    await database.execAsync(`
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

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_expense_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_type TEXT UNIQUE NOT NULL,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS delivery_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dlf_code TEXT NOT NULL,
        expense_type TEXT NOT NULL,
        amount TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
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
        delivery_address TEXT,
        dds_id TEXT,
        address TEXT,
        customer_arrival TEXT,
        customer_departure TEXT,
        quantity TEXT,
        remarks TEXT,
        form_type TEXT DEFAULT 'delivery',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'no'
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        position TEXT DEFAULT 'Logistics Driver'
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_trucks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        truck_plate TEXT UNIQUE NOT NULL,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS truck_fuel_monitoring (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tfp_id TEXT UNIQUE NOT NULL,
        utility_driver TEXT NOT NULL,
        truck_plate TEXT NOT NULL,
        type TEXT,
        cash_advance TEXT,
        departure_time TEXT,
        odometer_readings TEXT,
        invoice_date TEXT,
        reference_no TEXT,
        tin_no TEXT,
        particular TEXT DEFAULT 'Fuel',
        payee TEXT,
        receipt_photo_path TEXT,
        receipt_photo_url TEXT,
        photo_uploaded INTEGER DEFAULT 0,
        total_liters TEXT,
        cost_per_liter TEXT,
        total_amount TEXT,
        vat_amount TEXT,
        net_amount TEXT,
        arrival_time TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'no'
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_payees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payee_name TEXT NOT NULL UNIQUE,
        tin_no TEXT NOT NULL,
        last_used TEXT DEFAULT CURRENT_TIMESTAMP,
        usage_count INTEGER DEFAULT 1
      );
    `);

    console.log('✅Application Ready To Use');
    return database;
  } catch (error) {
    console.error('❌ Database init error:', error);
    throw error;
  }
};

// Comment this later
export const seedTestUser = async () => {
  try {
    const { ensureDbInitialized } = require('./helpers');
    const database = ensureDbInitialized();
    await database.runAsync(
      `INSERT OR IGNORE INTO users (first_name, middle_name, last_name, username, password, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Ryan', 'Ralleca', 'Acosta', 'test', 'test', 'Service Vehicle Driver']
    );
    console.log('Test user seeded');
  } catch (error) {
    console.error('Seed user error:', error);
  }
};

// ---------------------
// Export helpers
// ---------------------
export * from './helpers';

// ---------------------
// Export all functions from modules
// ---------------------
export * from './userDb';
export * from './deliveryDb';
export * from './fuelDb';