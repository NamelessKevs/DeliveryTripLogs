import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { 
  getCurrentUser,
  generateTfpId,
  addFuelRecord,
  updateFuelRecord,
  getFuelRecordByTfpId,
  getLocalTimestamp,
} from '../database/db';

const TruckFuelFormScreen = ({ navigation, route }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Draft fields
  const [tfpId, setTfpId] = useState('');
  const [utilityDriver, setUtilityDriver] = useState('');
  const [truckPlate, setTruckPlate] = useState('');
  const [type, setType] = useState('');
  const [cashAdvance, setCashAdvance] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  
  // Finalize fields
  const [departureTime, setDepartureTime] = useState(null);
  const [odometerReadings, setOdometerReadings] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(null);
  const [referenceNo, setReferenceNo] = useState('');
  const [payee, setPayee] = useState('');
  const [totalLiters, setTotalLiters] = useState('');
  const [costPerLiter, setCostPerLiter] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [vatAmount, setVatAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [arrivalTime, setArrivalTime] = useState(null);
  
  // Date picker states
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);

  useEffect(() => {
    loadInitialData();
    
    // Check if editing existing record
    if (route.params?.recordToEdit) {
      setIsEditMode(true);
      loadRecordForEdit(route.params.recordToEdit);
    }
  }, [route.params]);

  const loadInitialData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        navigation.navigate('Login');
        return;
      }
      setCurrentUser(user);
      
      // Generate TFP ID for new record
      if (!route.params?.recordToEdit) {
        const newTfpId = await generateTfpId();
        setTfpId(newTfpId);
      }
    } catch (error) {
      console.error('Load initial data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecordForEdit = (record) => {
    setTfpId(record.tfp_id);
    setUtilityDriver(record.utility_driver);
    setTruckPlate(record.truck_plate);
    setType(record.type || '');
    setCashAdvance(record.cash_advance || '');
    setDepartureTime(record.departure_time);
    setOdometerReadings(record.odometer_readings || '');
    setInvoiceDate(record.invoice_date);
    setReferenceNo(record.reference_no || '');
    setPayee(record.payee || '');
    setTotalLiters(record.total_liters || '');
    setCostPerLiter(record.cost_per_liter || '');
    setTotalAmount(record.total_amount || '');
    setVatAmount(record.vat_amount || '');
    setNetAmount(record.net_amount || '');
    setArrivalTime(record.arrival_time);
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

  const formatDateOnly = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  const getFormattedUserName = () => {
    if (!currentUser) return '';
    const firstName = currentUser.first_name || '';
    const middleName = currentUser.middle_name || '';
    const lastName = currentUser.last_name || '';
    const middleInitial = middleName ? middleName.charAt(0).toUpperCase() + '.' : '';
    return `${firstName} ${middleInitial} ${lastName}`.trim();
  };

  // Calculate total amount when liters or cost changes
  useEffect(() => {
    if (totalLiters && costPerLiter) {
      const liters = parseFloat(totalLiters);
      const cost = parseFloat(costPerLiter);
      
      if (!isNaN(liters) && !isNaN(cost)) {
        const total = (liters * cost).toFixed(2);
        setTotalAmount(total);
        
        // Calculate VAT (12%)
        const vat = ((total / 1.12) * 0.12).toFixed(2);
        setVatAmount(vat);
        
        // Calculate Net Amount
        const net = (total - vat).toFixed(2);
        setNetAmount(net);
      }
    }
  }, [totalLiters, costPerLiter]);

  const handleCaptureDeparture = async () => {
    const now = formatDateTime(new Date());
    setDepartureTime(now);
  };

  const handleCaptureArrival = async () => {
    if (!departureTime) {
      Alert.alert('Warning', 'Please capture departure time first');
      return;
    }
    const now = formatDateTime(new Date());
    setArrivalTime(now);
  };

  const handleInvoiceDateChange = (event, selectedDate) => {
    setShowInvoiceDatePicker(false);
    if (selectedDate) {
      const formatted = formatDateOnly(selectedDate);
      setInvoiceDate(formatted);
    }
  };

  const handleSaveDraft = async () => {
    // Validation for draft
    if (!utilityDriver.trim()) {
      Alert.alert('Error', 'Please enter Service Vehicle Driver name');
      return;
    }
    
    if (!truckPlate.trim()) {
      Alert.alert('Error', 'Please enter truck plate number');
      return;
    }
    
    try {
      const recordData = {
        tfp_id: tfpId,
        utility_driver: utilityDriver.trim(),
        truck_plate: truckPlate.trim().toUpperCase(),
        type: type || null,
        cash_advance: cashAdvance || null,
        departure_time: departureTime,
        odometer_readings: odometerReadings || null,
        invoice_date: invoiceDate,
        reference_no: referenceNo || null,
        particular: 'Fuel',
        payee: payee || null,
        total_liters: totalLiters || null,
        cost_per_liter: costPerLiter || null,
        total_amount: totalAmount || null,
        vat_amount: vatAmount || null,
        net_amount: netAmount || null,
        arrival_time: arrivalTime,
        created_by: getFormattedUserName(),
        created_at: getLocalTimestamp(),
        synced: -1,
        sync_status: 'no',
      };
      
      if (isEditMode) {
        const existing = await getFuelRecordByTfpId(tfpId);
        if (existing) {
          await updateFuelRecord(existing.id, recordData);
        }
      } else {
        await addFuelRecord(recordData);
      }
      
      Alert.alert('Success', 'Fuel record saved as draft!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFinalize = async () => {
    // Validation for finalize
    if (!utilityDriver.trim()) {
      Alert.alert('Error', 'Please enter Service Vehicle Driver name');
      return;
    }
    
    if (!truckPlate.trim()) {
      Alert.alert('Error', 'Please enter truck plate number');
      return;
    }
    
    if (!departureTime) {
      Alert.alert('Error', 'Please capture departure time');
      return;
    }
    
    if (!arrivalTime) {
      Alert.alert('Error', 'Please capture arrival time');
      return;
    }
    
    if (!odometerReadings.trim()) {
      Alert.alert('Error', 'Please enter odometer readings');
      return;
    }
    
    if (!invoiceDate) {
      Alert.alert('Error', 'Please select invoice date');
      return;
    }
    
    if (!referenceNo.trim()) {
      Alert.alert('Error', 'Please enter reference number');
      return;
    }
    
    if (!payee.trim()) {
      Alert.alert('Error', 'Please enter payee');
      return;
    }

    if (!type.trim()) {
      Alert.alert('Error', 'Please enter type');
      return;
    }
    
    if (!totalLiters || parseFloat(totalLiters) <= 0) {
      Alert.alert('Error', 'Please enter valid total liters');
      return;
    }
    
    if (!costPerLiter || parseFloat(costPerLiter) <= 0) {
      Alert.alert('Error', 'Please enter valid cost per liter');
      return;
    }
    
    // Validate cash advance if type is Cash
    if (type === 'Cash' && !cashAdvance.trim()) {
      Alert.alert('Error', 'Cash advance is required when type is Cash');
      return;
    }
    
    try {
      const recordData = {
        tfp_id: tfpId,
        utility_driver: utilityDriver.trim(),
        truck_plate: truckPlate.trim().toUpperCase(),
        type: type || null,
        cash_advance: cashAdvance || null,
        departure_time: departureTime,
        odometer_readings: odometerReadings.trim(),
        invoice_date: invoiceDate,
        reference_no: referenceNo.trim(),
        particular: 'Fuel',
        payee: payee.trim(),
        total_liters: totalLiters,
        cost_per_liter: costPerLiter,
        total_amount: totalAmount,
        vat_amount: vatAmount,
        net_amount: netAmount,
        arrival_time: arrivalTime,
        created_by: getFormattedUserName(),
        created_at: getLocalTimestamp(),
        synced: 0,
        sync_status: 'no',
      };
      
      if (isEditMode) {
        const existing = await getFuelRecordByTfpId(tfpId);
        if (existing) {
          await updateFuelRecord(existing.id, recordData);
        }
      } else {
        await addFuelRecord(recordData);
      }
      
      Alert.alert('Success', 'Fuel record finalized and ready to sync!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Finalize error:', error);
      Alert.alert('Error', 'Failed to finalize: ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1FCFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* TFP ID Display */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>TFP ID:</Text>
          <Text style={styles.infoValue}>{tfpId}</Text>
        </View>

        {/* Draft Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Service Vehicle Driver <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter driver name"
            value={utilityDriver}
            onChangeText={setUtilityDriver}
          />

          <Text style={styles.label}>Truck Plate <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC1234"
            autoCapitalize="characters"
            value={truckPlate}
            onChangeText={setTruckPlate}
          />

          <Text style={styles.label}>Type</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={styles.dropdownText}>
              {type || 'Select type...'}
            </Text>
          </TouchableOpacity>

          {type === 'Cash' && (
            <>
              <Text style={styles.label}>Cash Advance <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="decimal-pad"
                value={cashAdvance}
                onChangeText={setCashAdvance}
              />
            </>
          )}
        </View>

        {/* Finalize Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finalize Details</Text>
          
          {/* Departure Time */}
          <Text style={styles.label}>Departure Time <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCaptureDeparture}
          >
            <Text style={styles.captureButtonText}>
              {formatTimeOnly(departureTime)}
            </Text>
          </TouchableOpacity>

          {/* Odometer */}
          <Text style={styles.label}>Odometer Readings <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 125400"
            keyboardType="number-pad"
            value={odometerReadings}
            onChangeText={setOdometerReadings}
          />

          {/* Invoice Date */}
          <Text style={styles.label}>Invoice Date <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => setShowInvoiceDatePicker(true)}
          >
            <Text style={styles.captureButtonText}>
              {invoiceDate || 'Select date'}
            </Text>
          </TouchableOpacity>

          {/* Reference No */}
          <Text style={styles.label}>Reference No <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter reference number"
            keyboardType='numeric'
            value={referenceNo}
            onChangeText={setReferenceNo}
          />

          {/* Payee */}
          <Text style={styles.label}>Payee <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter payee name"
            value={payee}
            onChangeText={setPayee}
          />

          {/* Total Liters */}
          <Text style={styles.label}>Qty Liters <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50.5"
            keyboardType="decimal-pad"
            value={totalLiters}
            onChangeText={setTotalLiters}
          />

          {/* Cost Per Liter */}
          <Text style={styles.label}>Cost Per Liter <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 65.50"
            keyboardType="decimal-pad"
            value={costPerLiter}
            onChangeText={setCostPerLiter}
          />

          {/* Total Amount (Auto-calculated, read-only) */}
          <Text style={styles.label}>Total Amount</Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            value={totalAmount ? `₱${totalAmount}` : ''}
            editable={false}
          />

          {/* Arrival Time */}
          <Text style={styles.label}>Arrival Time <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCaptureArrival}
          >
            <Text style={styles.captureButtonText}>
              {formatTimeOnly(arrivalTime)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Draft / Finalize Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
            <Text style={styles.buttonText}>💾 Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finalizeButton} onPress={handleFinalize}>
            <Text style={styles.buttonText}>✅ Finalize</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Type Picker Modal */}
      <Modal visible={showTypePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.modalTitle}>Select Type</Text>
            {['Fleet Card', 'Cash'].map((t, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.pickerItem}
                onPress={() => {
                  setType(t);
                  setShowTypePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{t}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.pickerCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invoice Date Picker */}
      {showInvoiceDatePicker && (
        <DateTimePicker
          value={invoiceDate ? new Date(invoiceDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleInvoiceDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  required: {
    color: 'red',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#e3f7ff',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    color: '#1FCFFF',
    fontWeight: 'bold',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  inputReadOnly: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  captureButton: {
    backgroundColor: '#1FCFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#84827dff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  finalizeButton: {
    flex: 1,
    backgroundColor: '#1FCFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerCloseButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  pickerCloseButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TruckFuelFormScreen;