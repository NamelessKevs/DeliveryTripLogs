import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert} from 'react-native';
import { styles, Colors } from '../styles/styles';

const ExpenseModal = ({ visible, expenseTypes, onSave, onCancel }) => {
  const [selectedType, setSelectedType] = useState('');
  const [amount, setAmount] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleSave = () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an expense type');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    onSave(selectedType, amount);
    
    // Reset form
    setSelectedType('');
    setAmount('');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.expenseModalOverlay}>
        <View style={styles.expenseModalContent}>
          <Text style={styles.expenseModalTitle}>Add Expense</Text>

          {/* Expense Type Selector */}
          <Text style={styles.expenseModalLabel}>Expense Type *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedType || 'Select expense type...'}
            </Text>
          </TouchableOpacity>

          {/* Amount Input */}
          <Text style={styles.expenseModalLabel}>Amount (₱) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Buttons */}
          <View style={styles.expenseModalButtonRow}>
            <TouchableOpacity style={styles.expenseModalCancelButton} onPress={onCancel}>
              <Text style={styles.expenseModalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.expenseModalSaveButton} onPress={handleSave}>
              <Text style={styles.expenseModalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Expense Type Picker Modal */}
      <Modal visible={showTypePicker} animationType="fade" transparent>
        <View style={styles.expenseModalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.expenseModalTitle}>Select Expense Type</Text>
            <ScrollView style={styles.pickerScroll}>
              {expenseTypes.map((type, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedType(type);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.pickerCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default ExpenseModal;