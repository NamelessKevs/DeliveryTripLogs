import * as SQLite from 'expo-sqlite';

let db;

// ---------------------
// Database Safety Check
// ---------------------
export const ensureDbInitialized = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const setDb = (database) => {
  db = database;
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