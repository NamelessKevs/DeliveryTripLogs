import React, { useState, useEffect, useCallback } from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, ActivityIndicator, RefreshControl} from 'react-native';
import { getAllUsers, updateUser, deleteUser, getCurrentUser, initDatabase } from '../database/db';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, Colors } from '../styles/styles';

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editPosition, setEditPosition] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    password: '',
    position: 'Driver',
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
      password: '', // Leave password empty for security
      position: user.position || 'Logistics Driver',
    });
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!form.first_name || !form.last_name || !form.username) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // If editing and password is empty, don't update password
    const updateData = {
      first_name: form.first_name,
      middle_name: form.middle_name || null,
      last_name: form.last_name,
      username: form.username,
      position: form.position,
    };

    // Only include password if it's been changed
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
    // Check if trying to delete own account
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

  const closeModal = () => {
    setModalVisible(false);
    setEditingUser(null);
    setForm({
      first_name: '',
      middle_name: '',
      last_name: '',
      username: '',
      password: '',
    });
  };

  const renderUser = ({ item }) => {
    const isCurrentUser = currentUser && item.id === currentUser.id;
    
    return (
      <View style={styles.userManagementCard}>
        <View style={styles.userManagementUserInfo}>
          <Text style={styles.userManagementUserName}>
            {item.first_name} {item.middle_name ? item.middle_name + ' ' : ''}{item.last_name}
            {isCurrentUser && <Text style={styles.userManagementYouBadge}> (You)</Text>}
          </Text>
          <Text style={styles.userManagementUserUsername}>
            @{item.username} • {item.position || 'Driver'}
          </Text>
        </View>
        <View style={styles.userManagementActionButtons}>
          <TouchableOpacity
            style={styles.userManagementEditButton}
            onPress={() => handleEditUser(item)}>
            <Text style={styles.userManagementEditButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.userManagementDeleteButton}
            onPress={() => handleDeleteUser(item)}>
            <Text style={styles.userManagementDeleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.userManagementContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#1FCFFF" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          renderItem={renderUser}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.userManagementList}
        />
      )}

      {/* Reset Database Button - For Testing Only */}
      <TouchableOpacity
        style={styles.userManagementResetButton}
        onPress={() => {
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
                    
                    // Force logout
                    await AsyncStorage.removeItem('currentUser');
                    
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
        }}
      >
        <Text style={styles.userManagementResetButtonText}>🔧 Reset All Database</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.userManagementModalContainer}>
          <View style={styles.userManagementModalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Text>
            <Text style={styles.label}>Position</Text>
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPositionPicker(true)}
              >
                <Text style={styles.dropdownText}>{form.position}</Text>
              </TouchableOpacity>
            </View>
            <Modal visible={showPositionPicker} animationType="fade" transparent>
              <View style={styles.modalOverlay}>
                <View style={styles.pickerContent}>
                  <Text style={styles.modalTitle}>Select Position</Text>
                  {['Logistics Driver', 'Service Vehicle Driver'].map((pos, idx) => (
                    <TouchableOpacity key={idx} style={styles.pickerItem} onPress={() => {setForm({ ...form, position: pos }); setShowPositionPicker(false);}}>
                      <Text style={styles.pickerItemText}>{pos}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.pickerCloseButton} onPress={() => setShowPositionPicker(false)}>
                    <Text style={styles.pickerCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Text style={styles.label}>User Information</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={form.first_name}
              onChangeText={text => setForm({ ...form, first_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Middle Name (Optional)"
              value={form.middle_name}
              onChangeText={text => setForm({ ...form, middle_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={form.last_name}
              onChangeText={text => setForm({ ...form, last_name: text })}
            />
            <Text style={styles.label}>User Account</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={form.username}
              onChangeText={text => setForm({ ...form, username: text })}
            />
            <TextInput
              style={styles.input}
              placeholder={editingUser ? "New Password (leave empty to keep current)" : "Password"}
              secureTextEntry
              value={form.password}
              onChangeText={text => setForm({ ...form, password: text })}
            />

            <View style={styles.userManagementModalButtons}>
              <TouchableOpacity
                style={styles.userManagementModalBtnCancel}
                onPress={closeModal}>
                <Text style={styles.userManagementModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.userManagementModalBtnSave}
                onPress={handleSaveUser}>
                <Text style={styles.userManagementModalBtnText}>
                  {editingUser ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserManagementScreen;