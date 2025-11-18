import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert} from 'react-native';
import * as Location from 'expo-location';
import { styles, Colors } from '../styles/styles';

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
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [drNo, setDrNo] = useState('');
  const [siNo, setSiNo] = useState('');

  useEffect(() => {
    if (editingDrop) {
      // Load existing drop data for editing
      const uniqueKey = `${editingDrop.customer}|${editingDrop.delivery_address}`;
      setSelectedCustomer(uniqueKey);
      setAddress(editingDrop.address || '');
      setArrivalTime(editingDrop.customer_arrival || null);
      setDepartureTime(editingDrop.customer_departure || null);
      setQuantity(editingDrop.quantity || '');
      setRemarks(editingDrop.remarks || '');
      setDrNo(editingDrop.dr_no || '');
      setSiNo(editingDrop.si_no || '');
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
    setQuantity('');
    setRemarks('');
    setDrNo('');
    setSiNo('');
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

  const handleSelectCustomer = (customerName, deliveryAddress) => {
    const uniqueKey = `${customerName}|${deliveryAddress}`;
    
    // Check if editing and trying to change customer
    if (editingDrop) {
      const editingKey = `${editingDrop.customer}|${editingDrop.delivery_address}`;
      if (uniqueKey !== editingKey) {
        Alert.alert('Note', 'Customer cannot be changed when editing a drop');
        return;
      }
    }
    
    // Check if this specific customer+address combo is already logged
    const isLogged = loggedCustomers.includes(uniqueKey);
    if (isLogged && !editingDrop) {
      return; // Silently ignore
    }
    
    setSelectedCustomer(uniqueKey);
  };

  const handleCaptureArrival = async () => {
    const now = formatDateTime(new Date());
    setArrivalTime(now);
    
    // Capture GPS coordinates
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location access');
        setAddress('Location permission denied');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balance speed vs accuracy
        timeout: 15000, // Wait up to 15 seconds
        maximumAge: 10000, // Accept cached location if < 10 seconds old
      });
      
      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      setAddress(coords);
    } catch (error) {
      console.error('GPS error:', error);
      Alert.alert('GPS Failed', 'Could not get location. Address set to: GPS unavailable');
      setAddress('GPS unavailable');
    }
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

    if (!arrivalTime) {
      Alert.alert('Error', 'Arrival time is required');
      return;
    }

    // Cannot save with only departure (must have arrival first)
    if (departureTime && !arrivalTime) {
      Alert.alert('Error', 'Cannot save departure without arrival time');
      return;
    }

    // Extract customer name and delivery address from uniqueKey
    const [customerName, deliveryAddress] = selectedCustomer.split('|');

    // Prepare drop data
    const dropData = {
      customer: customerName,
      dr_no: drNo.trim(),
      si_no: siNo.trim(),
      delivery_address: deliveryAddress,
      dds_id: delivery?.customers.find(c => `${c.customer_name}|${c.delivery_address}` === selectedCustomer)?.dds_id || null,
      form_type: 'delivery',
      address: address.trim(),
      customer_arrival: arrivalTime,
      customer_departure: departureTime,
      quantity: quantity.trim(),
      remarks: remarks.trim(),
    };

    // Include fields that shouldn't be changed during edit
    if (editingDrop) {
      dropData.dlf_code = editingDrop.dlf_code;
      dropData.driver = editingDrop.driver;
      dropData.helper = editingDrop.helper;
      dropData.plate_no = editingDrop.plate_no;
      dropData.trip_count = editingDrop.trip_count;
      dropData.company_departure = editingDrop.company_departure;
      dropData.company_arrival = editingDrop.company_arrival;
      dropData.plant_run_hours = editingDrop.plant_run_hours;
      dropData.plant_odo_departure = editingDrop.plant_odo_departure;
      dropData.plant_odo_arrival = editingDrop.plant_odo_arrival;
      dropData.plant_kms_run = editingDrop.plant_kms_run;
      dropData.drop_number = editingDrop.drop_number;
      dropData.delivery_address = editingDrop.delivery_address;
      dropData.dr_no = editingDrop.dr_no;
      dropData.si_no = editingDrop.si_no;
      dropData.dds_id = editingDrop.dds_id;
      dropData.form_type = editingDrop.form_type;
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
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.customerDropModalOverlay}>
        <View style={styles.customerDropModalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.customerDropModalTitle}>
              {editingDrop ? 'Edit Customer Drop' : 'Log Customer Drop'}
            </Text>

            {/* Customer Selection */}
            <Text style={styles.customerDropLabel}>Choose Customer</Text>
              {delivery?.customers.map((customer, idx) => {
                const uniqueKey = `${customer.customer_name}|${customer.delivery_address}`;
                const isLogged = loggedCustomers.includes(uniqueKey);
                const isSelected = selectedCustomer === uniqueKey;
                const isDisabled = isLogged && !editingDrop;
                
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.customerDropRadioOption,
                      isSelected && styles.customerDropRadioOptionSelected,
                      isDisabled && styles.customerDropRadioOptionDisabled,
                    ]}
                    onPress={() => handleSelectCustomer(customer.customer_name, customer.delivery_address)}
                    disabled={isDisabled}
                  >
                  <View style={styles.customerDropRadioButton}>
                    {isSelected && <View style={styles.customerDropRadioButtonInner} />}
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.customerDropRadioText}>
                      {customer.customer_name}
                      {isLogged && <Text style={styles.customerDropLoggedBadge}> ✓ Logged</Text>}
                    </Text>
                    {customer.delivery_address && (
                      <Text style={styles.customerDropDeliveryAddressSubtext}>
                        📍 {customer.delivery_address}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* DR No */}
            <Text style={styles.customerDropLabel}>DR No</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter DR number"
              autoCapitalize="characters"
              value={drNo}
              onChangeText={setDrNo}
            />

            {/* SI No */}
            <Text style={styles.customerDropLabel}>SI No</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter SI number"
              autoCapitalize="characters"
              value={siNo}
              onChangeText={setSiNo}
            />

            {/* Arrival Time */}
            <Text style={styles.customerDropLabel}>Arrival Time <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.customerDropCaptureButton}
              onPress={handleCaptureArrival}
            >
              <Text style={styles.customerDropCaptureButtonText}>
                {arrivalTime ? formatTimeDisplay(arrivalTime) : '[Capture Now]'}
              </Text>
            </TouchableOpacity>

            {/* Departure Time */}
            <Text style={styles.customerDropLabel}>Departure Time</Text>
            <TouchableOpacity
              style={styles.customerDropCaptureButton}
              onPress={handleCaptureDeparture}
            >
              <Text style={styles.customerDropCaptureButtonText}>
                {departureTime ? formatTimeDisplay(departureTime) : '[Capture Now]'}
              </Text>
            </TouchableOpacity>

            {/* Quantity */}
            <View style={styles.hideMe}>
              <Text style={styles.customerDropLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 125400"
                keyboardType="number-pad"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>

            {/* Remarks */}
            <Text style={styles.customerDropLabel}>Remarks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add remarks or notes"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />

            {/* Action Buttons */}
            <View style={styles.customerDropButtonRow}>
              <TouchableOpacity style={styles.customerDropCancelButton} onPress={onCancel}>
                <Text style={styles.customerDropCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.customerDropSaveButton} onPress={handleSave}>
                <Text style={styles.customerDropSaveButtonText}>
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

export default CustomerDropModal;