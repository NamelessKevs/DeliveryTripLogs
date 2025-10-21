import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';

const CustomerDropModal = ({ 
  visible, 
  delivery, 
  editingDrop, 
  loggedCustomers = [],
  onSave, 
  onCancel 
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [address, setAddress] = useState('');
  const [arrivalTime, setArrivalTime] = useState(null);
  const [departureTime, setDepartureTime] = useState(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (editingDrop) {
      // Load existing drop data for editing
      setSelectedCustomer(editingDrop.customer || '');
      setAddress(editingDrop.address || '');
      setArrivalTime(editingDrop.customer_arrival || null);
      setDepartureTime(editingDrop.customer_departure || null);
      setRemarks(editingDrop.remarks || '');
    } else {
      // Reset for new drop
      resetForm();
    }
  }, [editingDrop, visible]);

  const resetForm = () => {
    setSelectedCustomer('');
    setAddress('');
    setArrivalTime(null);
    setDepartureTime(null);
    setRemarks('');
  };

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatTimeDisplay = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleSelectCustomer = (customerName) => {
    if (editingDrop) {
      // When editing, customer is locked - show alert
      Alert.alert('Note', 'Customer cannot be changed when editing a drop');
      return;
    }
    
    setSelectedCustomer(customerName);
    
    // Pre-fill remarks with SO numbers for this customer
    const customer = delivery.customers.find(c => c.customer_name === customerName);
    if (customer && customer.so_no) {
      setRemarks(customer.so_no);
    }
  };

  const handleCaptureArrival = () => {
    const now = formatDateTime(new Date());
    setArrivalTime(now);
  };

  const handleCaptureDeparture = () => {
    if (!arrivalTime) {
      Alert.alert('Error', 'Please capture arrival time first');
      return;
    }
    const now = formatDateTime(new Date());
    setDepartureTime(now);
  };

  const handleSave = () => {
    // Validation
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter address');
      return;
    }

    if (!arrivalTime) {
      Alert.alert('Error', 'Arrival time is required');
      return;
    }

    // Cannot save with only departure (must have arrival first)
    if (departureTime && !arrivalTime) {
      Alert.alert('Error', 'Cannot save departure without arrival time');
      return;
    }

    // Prepare drop data
    const dropData = {
      customer: selectedCustomer,
      address: address.trim(),
      customer_arrival: arrivalTime,
      customer_departure: departureTime,
      remarks: remarks.trim(),
    };

    // Include fields that shouldn't be changed during edit
    if (editingDrop) {
      dropData.delivery_id = editingDrop.delivery_id;
      dropData.driver_name = editingDrop.driver_name;
      dropData.helper = editingDrop.helper;
      dropData.truck_plate = editingDrop.truck_plate;
      dropData.trip = editingDrop.trip;
      dropData.drop_number = editingDrop.drop_number;
      dropData.company_departure = editingDrop.company_departure;
      dropData.company_arrival = editingDrop.company_arrival;
      dropData.created_by = editingDrop.created_by;
      dropData.created_at = editingDrop.created_at;
      dropData.synced = editingDrop.synced;
      dropData.sync_status = editingDrop.sync_status;
    }

    onSave(dropData);
    resetForm();
  };

  const isCustomerLogged = (customerName) => {
    return loggedCustomers.includes(customerName);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {editingDrop ? 'Edit Customer Drop' : 'Log Customer Drop'}
            </Text>

            {/* Customer Selection */}
            <Text style={styles.label}>Choose Customer</Text>
            {delivery?.customers.map((customer, idx) => {
              const isLogged = isCustomerLogged(customer.customer_name);
              const isSelected = selectedCustomer === customer.customer_name;
              const isDisabled = editingDrop && selectedCustomer !== customer.customer_name;
              
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.radioOption,
                    isSelected && styles.radioOptionSelected,
                    isDisabled && styles.radioOptionDisabled,
                  ]}
                  onPress={() => handleSelectCustomer(customer.customer_name)}
                  disabled={isDisabled}
                >
                  <View style={styles.radioButton}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioText}>
                    {customer.customer_name}
                    {isLogged && <Text style={styles.loggedBadge}> ✓</Text>}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Address Input */}
            <Text style={styles.label}>📍 Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter delivery address"
              value={address}
              onChangeText={setAddress}
              multiline
            />

            {/* Arrival Time */}
            <Text style={styles.label}>Arrival Time <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCaptureArrival}
            >
              <Text style={styles.captureButtonText}>
                {arrivalTime ? formatTimeDisplay(arrivalTime) : '[Capture Now]'}
              </Text>
            </TouchableOpacity>

            {/* Departure Time */}
            <Text style={styles.label}>Departure Time</Text>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCaptureDeparture}
            >
              <Text style={styles.captureButtonText}>
                {departureTime ? formatTimeDisplay(departureTime) : '[Capture Now]'}
              </Text>
            </TouchableOpacity>

            {/* Remarks */}
            <Text style={styles.label}>Remarks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add remarks or notes"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingDrop ? 'Update Drop' : 'Save Drop'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  required: {
    color: 'red',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  radioOptionSelected: {
    borderColor: '#1FCFFF',
    backgroundColor: '#e3f7ff',
  },
  radioOptionDisabled: {
    opacity: 0.5,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1FCFFF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1FCFFF',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  loggedBadge: {
    color: '#10dc17ff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  captureButton: {
    backgroundColor: '#1FCFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#641',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1FCFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerDropModal;