import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { registerUser, getAllUsers, updateUser, deleteUser, getCurrentUser } from '../database/db';

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    password: '',
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
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.first_name} {item.middle_name ? item.middle_name + ' ' : ''}{item.last_name}
            {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
          </Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditUser(item)}>
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item)}>
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </Text>

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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={closeModal}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={handleSaveUser}>
                <Text style={styles.modalBtnText}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 15 },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: { fontSize: 16, fontWeight: '600', color: '#333' },
  youBadge: {
    fontSize: 12,
    color: '#1FCFFF',
    fontWeight: '700',
  },
  userUsername: { fontSize: 12, color: '#666', marginTop: 2 },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#b7eefdff',
    padding: 10,
    borderRadius: 8,
    width: 45,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: '#ffc0c0ff',
    padding: 10,
    borderRadius: 8,
    width: 45,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtnCancel: { 
    backgroundColor: '#ccc', 
    padding: 12, 
    borderRadius: 8,
    flex: 1,
  },
  modalBtnSave: { 
    backgroundColor: '#1FCFFF', 
    padding: 12, 
    borderRadius: 8,
    flex: 1,
  },
  modalBtnText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});

export default UserManagementScreen;