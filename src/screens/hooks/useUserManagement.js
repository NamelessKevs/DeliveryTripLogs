import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getAllUsers, updateUser, deleteUser, getCurrentUser, initDatabase } from '../../database/db';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserManagement = (navigation) => {
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    password: '',
    position: 'Logistics Driver',
  });

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Load current user error:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUsers();
      loadCurrentUser();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    await loadCurrentUser();
    setRefreshing(false);
  }, []);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setForm({
      first_name: user.first_name,
      middle_name: user.middle_name || '',
      last_name: user.last_name,
      username: user.username,
      password: '',
      position: user.position || 'Logistics Driver',
    });
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!form.first_name || !form.last_name || !form.username) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const updateData = {
      first_name: form.first_name,
      middle_name: form.middle_name || null,
      last_name: form.last_name,
      username: form.username,
      position: form.position,
    };

    if (form.password) {
      updateData.password = form.password;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, updateData);
        Alert.alert('Success', 'User updated successfully');
      }
      
      setForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        username: '',
        password: '',
        position: 'Logistics Driver',
      });
      setEditingUser(null);
      setModalVisible(false);
      await loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Could not save user. Username might be taken.');
      console.error(error);
    }
  };

  const handleDeleteUser = (user) => {
    if (currentUser && user.id === currentUser.id) {
      Alert.alert(
        'Cannot Delete',
        'You cannot delete your own account while logged in.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.first_name} ${user.last_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
              await loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Could not delete user');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'This will delete ALL data and recreate tables. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync('DeliveryTripLogs.db');
              
              await db.execAsync(`
                DROP TABLE IF EXISTS cached_deliveries;
                DROP TABLE IF EXISTS cached_expense_types;
                DROP TABLE IF EXISTS delivery_expenses;
                DROP TABLE IF EXISTS trip_logs;
                DROP TABLE IF EXISTS users;
                DROP TABLE IF EXISTS truck_fuel_monitoring;
                DROP TABLE IF EXISTS cached_trucks;
                DROP TABLE IF EXISTS saved_payees;
              `);
              
              await initDatabase();
              
              await AsyncStorage.removeItem('current_user');
              
              Alert.alert(
                'Success', 
                'Database reset. Redirecting to login...',
                [{ 
                  text: 'OK',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  }
                }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to reset database: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingUser(null);
    setForm({
      first_name: '',
      middle_name: '',
      last_name: '',
      username: '',
      password: '',
      position: 'Logistics Driver',
    });
  };

  return {
    // State
    users, refreshing, loading, modalVisible, editingUser, currentUser, showPositionPicker, form,
    // Setters
    setShowPositionPicker, setForm,
    // Handlers
    onRefresh, handleEditUser, handleSaveUser, handleDeleteUser, handleResetDatabase, closeModal,
  };
};