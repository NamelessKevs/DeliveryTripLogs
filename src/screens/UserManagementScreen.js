import React from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, RefreshControl} from 'react-native';
import { styles, Colors } from '../styles/styles';
import { useUserManagement } from './hooks/useUserManagement';

const UserManagementScreen = ({ navigation }) => {
  const {
    // State
    users, refreshing, loading, modalVisible, editingUser, currentUser, showPositionPicker, form,
    // Setters
    setShowPositionPicker, setForm,
    // Handlers
    onRefresh, handleEditUser, handleSaveUser, handleDeleteUser, handleResetDatabase, closeModal,
  } = useUserManagement(navigation);

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
        <ActivityIndicator size="large" color={Colors.primary} />
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

      {/* Reset Database Button */}
      <TouchableOpacity
        style={styles.userManagementResetButton}
        onPress={handleResetDatabase}
      >
        <Text style={styles.userManagementResetButtonText}>🔧 Reset All Database</Text>
      </TouchableOpacity>

      {/* Edit User Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.userManagementModalContainer}>
          <View style={styles.userManagementModalContent}>
            <Text style={styles.userManagementModalTitle}>
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
            
            {/* Position Picker Modal */}
            <Modal visible={showPositionPicker} animationType="fade" transparent>
              <View style={styles.modalOverlay}>
                <View style={styles.pickerContent}>
                  <Text style={styles.modalTitle}>Select Position</Text>
                  {['Logistics Driver', 'Service Vehicle Driver'].map((pos, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.pickerItem} 
                      onPress={() => {
                        setForm({ ...form, position: pos }); 
                        setShowPositionPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{pos}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={styles.pickerCloseButton} 
                    onPress={() => setShowPositionPicker(false)}
                  >
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