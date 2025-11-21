import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import {getCurrentUser, generateTfpId, addFuelRecord, updateFuelRecord, getFuelRecordByTfpId, getLocalTimestamp,
getCachedTrucks, saveCachedTrucks, savePayee, searchPayees, takePhoto, savePhotoLocally, deleteLocalPhoto} from '../../database/db';
import { fetchTrucksFromAPI } from '../../api/maintenanceApi';

export const useTruckFuelForm = (navigation, route) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Draft fields
  const [tfpId, setTfpId] = useState('');
  const [utilityDriver, setUtilityDriver] = useState('');
  const [truckPlate, setTruckPlate] = useState('');
  const [showTruckPicker, setShowTruckPicker] = useState(false);
  const [cachedTrucks, setCachedTrucks] = useState([]);
  const [fetchingTrucks, setFetchingTrucks] = useState(false);
  const [type, setType] = useState('');
  const [cashAdvance, setCashAdvance] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  
  // Finalize fields
  const [departureTime, setDepartureTime] = useState(null);
  const [odometerReadings, setOdometerReadings] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(null);
  const [referenceNo, setReferenceNo] = useState('');
  const [tinNo, setTinNo] = useState('');
  const [payee, setPayee] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(0);
  const [totalLiters, setTotalLiters] = useState('');
  const [costPerLiter, setCostPerLiter] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [vatAmount, setVatAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [arrivalTime, setArrivalTime] = useState(null);

  const [payeeSuggestions, setPayeeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Date picker states
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);

  useEffect(() => {
    loadInitialData();
    
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

      const formattedName = getFormattedUserName(user);
      setUtilityDriver(formattedName);

      const trucks = await getCachedTrucks();
      setCachedTrucks(trucks);
      
      if (!route.params?.recordToEdit) {
        const newTfpId = await generateTfpId(formattedName);
        setTfpId(newTfpId);
      }
    } catch (error) {
      console.error('Load initial data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTrucks = async () => {
    setFetchingTrucks(true);
    try {
      const result = await fetchTrucksFromAPI();
      
      if (result.success && result.data) {
        await saveCachedTrucks(result.data);
        setCachedTrucks(result.data);
        Alert.alert('Success', `Loaded ${result.data.length} trucks`);
      } else {
        Alert.alert('Info', 'No trucks found');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setFetchingTrucks(false);
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
    setTinNo(record.tin_no || '');
    setPayee(record.payee || '');
    setReceiptPhoto(record.receipt_photo_path || null);
    setReceiptPhotoUrl(record.receipt_photo_url || null);
    setPhotoUploaded(record.photo_uploaded || 0);
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

  const getFormattedUserName = (user = currentUser) => {
    if (!user) return '';
    const firstName = user.first_name || '';
    const middleName = user.middle_name || '';
    const lastName = user.last_name || '';
    
    if (middleName) {
      const middleInitial = middleName.charAt(0).toUpperCase() + '.';
      return `${firstName} ${middleInitial} ${lastName}`;
    } else {
      return `${firstName} ${lastName}`;
    }
  };

  // Calculate total amount when liters or cost changes
  useEffect(() => {
    if (totalLiters && costPerLiter) {
      const liters = parseFloat(totalLiters);
      const cost = parseFloat(costPerLiter);
      
      if (!isNaN(liters) && !isNaN(cost)) {
        const total = (liters * cost).toFixed(2);
        setTotalAmount(total);
        
        const vat = ((total / 1.12) * 0.12).toFixed(2);
        setVatAmount(vat);
        
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

  const handlePayeeChange = async (text) => {
    setPayee(text);

    if (text.length > 0) {
      const results = await searchPayees(text);
      setPayeeSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectPayee = (selectedPayee) => {
    setPayee(selectedPayee.payee_name);
    setTinNo(selectedPayee.tin_no);
    setShowSuggestions(false);
  };

  const handleTakePhoto = async (useCamera) => {
    try {
      const photoUri = await takePhoto(useCamera);
      
      if (photoUri) {
        if (receiptPhoto) {
          await deleteLocalPhoto(receiptPhoto);
        }
        
        const localPath = await savePhotoLocally(photoUri, tfpId);
        setReceiptPhoto(localPath);
        setPhotoUploaded(0);
        
        Alert.alert('Success', 'Receipt photo saved!');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this receipt photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteLocalPhoto(receiptPhoto);
            setReceiptPhoto(null);
            setReceiptPhotoUrl(null);
            setPhotoUploaded(0);
          }
        }
      ]
    );
  };

  const handleSaveDraft = async () => {
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
        tin_no: tinNo || null,
        particular: 'Fuel',
        payee: payee || null,
        receipt_photo_path: receiptPhoto || null,
        receipt_photo_url: receiptPhotoUrl || null,
        photo_uploaded: photoUploaded,
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
        tin_no: tinNo.trim(),
        particular: 'Fuel',
        payee: payee.trim(),
        receipt_photo_path: receiptPhoto || null,
        receipt_photo_url: receiptPhotoUrl || null,
        photo_uploaded: photoUploaded,
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

      if (payee.trim() && tinNo.trim()) {
        await savePayee(payee.trim(), tinNo.trim());
      }
      
      Alert.alert('Success', 'Fuel record finalized and ready to sync!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Finalize error:', error);
      Alert.alert('Error', 'Failed to finalize: ' + error.message);
    }
  };

  return {
    // State
    loading, isEditMode, tfpId, utilityDriver, truckPlate, showTruckPicker, cachedTrucks, fetchingTrucks, type, cashAdvance,
    showTypePicker, departureTime, odometerReadings, invoiceDate, referenceNo, tinNo, payee, receiptPhoto, receiptPhotoUrl,
    photoUploaded, totalLiters, costPerLiter, totalAmount, vatAmount, netAmount, arrivalTime, payeeSuggestions, showSuggestions,
    showInvoiceDatePicker,
    // Setters
    setShowTruckPicker, setTruckPlate, setShowTypePicker, setType, setCashAdvance, setOdometerReadings, setShowInvoiceDatePicker,
    setReferenceNo, setTinNo, setTotalLiters, setCostPerLiter,
    // Handlers
    handleFetchTrucks, handleCaptureDeparture, handleCaptureArrival, handleInvoiceDateChange, handlePayeeChange, handleSelectPayee,
    handleTakePhoto, handleRemovePhoto, handleSaveDraft, handleFinalize,
    // Utilities
    formatTimeOnly,
  };
};