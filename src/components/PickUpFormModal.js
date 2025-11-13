import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { styles } from './CustomerDropModal'; // Import styles

const PickUpFormModal = ({ visible, editingPickUp, onSave, onCancel }) => {
  const [customer, setCustomer] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [address, setAddress] = useState('');
  const [arrivalTime, setArrivalTime] = useState(null);
  const [departureTime, setDepartureTime] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (editingPickUp) {
      setCustomer(editingPickUp.customer || '');
      setDeliveryAddress(editingPickUp.delivery_address || '');
      setAddress(editingPickUp.address || '');
      setArrivalTime(editingPickUp.customer_arrival || null);
      setDepartureTime(editingPickUp.customer_departure || null);
      setQuantity(editingPickUp.quantity || '');
      setRemarks(editingPickUp.remarks || '');
    } else if (!visible) {
      resetForm();
    }
  }, [editingPickUp, visible]);

  const resetForm = () => {
    setCustomer('');
    setDeliveryAddress('');
    setAddress('');
    setArrivalTime(null);
    setDepartureTime(null);
    setQuantity('');
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

  const handleCaptureArrival = async () => {
    const now = formatDateTime(new Date());
    setArrivalTime(now);
    
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location access');
        setAddress('Location permission denied');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
        maximumAge: 10000,
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
    if (!customer.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    if (!arrivalTime) {
      Alert.alert('Error', 'Arrival time is required');
      return;
    }

    const pickUpData = {
      customer: customer.trim(),
      delivery_address: deliveryAddress.trim() || null,
      dds_id: null,
      address: address.trim(),
      customer_arrival: arrivalTime,
      customer_departure: departureTime,
      quantity: quantity.trim(),
      remarks: remarks.trim(),
      dr_no: null,
      si_no: null,
      form_type: 'pick-up',
    };

    if (editingPickUp) {
      pickUpData.dlf_code = editingPickUp.dlf_code;
      pickUpData.driver = editingPickUp.driver;
      pickUpData.helper = editingPickUp.helper;
      pickUpData.plate_no = editingPickUp.plate_no;
      pickUpData.trip_count = editingPickUp.trip_count;
      pickUpData.company_departure = editingPickUp.company_departure;
      pickUpData.company_arrival = editingPickUp.company_arrival;
      pickUpData.plant_odo_departure = editingPickUp.plant_odo_departure;
      pickUpData.plant_odo_arrival = editingPickUp.plant_odo_arrival;
      pickUpData.drop_number = editingPickUp.drop_number;
      pickUpData.created_by = editingPickUp.created_by;
      pickUpData.created_at = editingPickUp.created_at;
      pickUpData.synced = editingPickUp.synced;
      pickUpData.sync_status = editingPickUp.sync_status;
    }

    onSave(pickUpData);
    resetForm();
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {editingPickUp ? 'Edit Pick-Up' : 'Log Pick-Up'}
            </Text>

            {/* Customer Name */}
            <Text style={styles.label}>Customer Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              value={customer}
              onChangeText={setCustomer}
            />

            {/* Delivery Address (Optional) */}
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter delivery address (optional)"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
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

            {/* Quantity */}
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 125400"
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />

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
                  {editingPickUp ? 'Update Pick-Up' : 'Save Pick-Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PickUpFormModal;