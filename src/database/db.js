import * as SQLite from 'expo-sqlite';

let db;

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('DeliveryTripLogs.db');

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
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);

    console.log('Database initialized');
    return db;
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
};

export const addTripLog = async (tripLog) => {
  try {
    const result = await db.runAsync(
      `INSERT INTO trip_logs (driver_name, truck_plate, from_location, to_location, start_time, end_time, remarks, created_at, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        tripLog.driver_name,
        tripLog.truck_plate || null,
        tripLog.from_location,
        tripLog.to_location,
        tripLog.start_time,
        tripLog.end_time,
        tripLog.remarks || null,
        tripLog.created_at || new Date().toISOString()
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Add trip log error:', error);
    throw error;
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

export const getAllTripLogs = async () => {
  try {
    const logs = await db.getAllAsync('SELECT * FROM trip_logs ORDER BY id DESC');
    return logs;
  } catch (error) {
    console.error('Get all logs error:', error);
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