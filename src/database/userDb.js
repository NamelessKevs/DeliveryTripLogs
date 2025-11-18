import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureDbInitialized, getLocalTimestamp } from './helpers';

// ---------------------
// Users Functions
// ---------------------
export const registerUser = async (user) => {
  try {
    const db = ensureDbInitialized();
    const result = await db.runAsync(
      `INSERT INTO users (first_name, middle_name, last_name, username, password, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.first_name,
        user.middle_name || null,
        user.last_name,
        user.username,
        user.password,
        user.position || 'Logistics Driver',
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
    const db = ensureDbInitialized();
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
    const db = ensureDbInitialized();
    const users = await db.getAllAsync('SELECT * FROM users ORDER BY id DESC');
    return users;
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
};

export const updateUser = async (id, user) => {
  try {
    const db = ensureDbInitialized();
    let query = `UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, username = ?, position = ?`;
    let params = [
      user.first_name,
      user.middle_name || null,
      user.last_name,
      user.username,
      user.position || 'Logistics Driver',
    ];

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
    const db = ensureDbInitialized();
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