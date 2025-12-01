import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {getCurrentUser, getCachedDeliveries, saveCachedDelivery, getCachedDeliveryById, getTripLogsByDeliveryId, addTripLog,
updateTripLog, updateCompanyTimes, getNextDropNumber, getLocalTimestamp, getAllTripLogs, addExpense, getExpensesByDeliveryId,
deleteExpense, getCachedExpenseTypes, saveCachedExpenseTypes} from '../../database/db';
import { fetchDeliveriesFromAPI } from '../../api/deliveryApi';

export const useDeliveryForm = (navigation, route) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Delivery selection
  const [deliveries, setDeliveries] = useState([]);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [allTrips, setAllTrips] = useState([]);
  // Company times
  const [companyDeparture, setCompanyDeparture] = useState(null);
  const [companyArrival, setCompanyArrival] = useState(null);
  // Drop logs
  const [dropLogs, setDropLogs] = useState([]);
  // Customer drop modal
  const [showDropModal, setShowDropModal] = useState(false);
  const [showPickUpModal, setShowPickUpModal] = useState(false);
  const [editingPickUp, setEditingPickUp] = useState(null);
  const [editingDrop, setEditingDrop] = useState(null);
  const [plantOdoDeparture, setPlantOdoDeparture] = useState('');
  const [plantOdoArrival, setPlantOdoArrival] = useState('');
  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);

  useEffect(() => {
    loadInitialData();
    
    if (route.params?.deliveryToEdit) {
      setIsEditMode(true);
      const draft = route.params.deliveryToEdit;
      
      getCachedDeliveryById(draft.dlf_code).then(cachedDelivery => {
        if (cachedDelivery) {
          handleSelectDelivery(cachedDelivery);
        } else {
          handleSelectDelivery({
            dlf_code: draft.dlf_code,
            driver: draft.driver,
            helper: draft.helper,
            plate_no: draft.plate_no,
            trip_count: draft.trip_count,
            customers: [],
          });
        }
      });
      
      setCompanyDeparture(draft.company_departure);
      setCompanyArrival(draft.company_arrival);
      setPlantOdoDeparture(draft.plant_odo_departure || '');
      setPlantOdoArrival(draft.plant_odo_arrival || '');
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
      
      const cached = await getCachedDeliveries();
      setDeliveries(cached);

      const types = await getCachedExpenseTypes();
      setExpenseTypes(types);
      
      const trips = await getAllTripLogs();
      setAllTrips(trips);
    } catch (error) {
      console.error('Load initial data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDeliveries = async () => {
    if (!currentUser) return;
    
    setSyncing(true);
    try {
      const driverName = getFormattedUserName();
      const result = await fetchDeliveriesFromAPI(driverName);
      
      if (result.success && result.data) {
        for (const item of result.data) {
          const deliveryData = {
            dlf_code: item.delivery_id,
            delivery_date: item.delivery_date,
            driver: item.driver,
            helper: item.helper,
            plate_no: item.truckplateno,
            trip_count: item.trip,
            customers: item.dds || [],
          };
          await saveCachedDelivery(deliveryData);
        }
        
        const cached = await getCachedDeliveries();
        setDeliveries(cached);

        if (result.expense_types && result.expense_types.length > 0) {
          await saveCachedExpenseTypes(result.expense_types);
          setExpenseTypes(result.expense_types);
        }
        
        Alert.alert('Fetch Data Updated', `DLF Fetch: ${cached.length}`);
      } else {
        Alert.alert('Info', 'No deliveries found');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectDelivery = async (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveryPicker(false);
    
    const logs = await getTripLogsByDeliveryId(delivery.dlf_code);
    setDropLogs(logs);

    const deliveryExpenses = await getExpensesByDeliveryId(delivery.dlf_code);
    setExpenses(deliveryExpenses);
    
    if (logs.length > 0) {
      setCompanyDeparture(logs[0].company_departure);
      setCompanyArrival(logs[0].company_arrival);
    } else {
      setCompanyDeparture(null);
      setCompanyArrival(null);
    }
  };

  const handleCaptureCompanyDeparture = () => {
    const now = formatDateTime(new Date());
    setCompanyDeparture(now);
    
    if (selectedDelivery && dropLogs.length > 0) {
      updateCompanyTimes(selectedDelivery.dlf_code, now, companyArrival);
    }
  };

  const handleCaptureCompanyArrival = () => {
    if (!companyDeparture) {
      Alert.alert('Warning', 'Please capture company departure time first');
      return;
    }

    const now = formatDateTime(new Date());
    setCompanyArrival(now);
    
    if (selectedDelivery && dropLogs.length > 0) {
      updateCompanyTimes(selectedDelivery.dlf_code, companyDeparture, now);
    }
  };

  const handleAddDrop = () => {
    if (!selectedDelivery) {
      Alert.alert('Error', 'Please select a delivery first');
      return;
    }
    setEditingDrop(null);
    setShowDropModal(true);
  };

  const handleEditDrop = (drop) => {
    if (drop.form_type === 'pick-up') {
      setEditingPickUp(drop);
      setShowPickUpModal(true);
    } else {
      setEditingDrop(drop);
      setShowDropModal(true);
    }
  };

  const handleSaveFromModal = async (dropData) => {
    try {
      const isEditing = editingDrop || editingPickUp;

      if (isEditing) {
        const logToUpdate = editingDrop || editingPickUp;
        await updateTripLog(logToUpdate.id, dropData);
        Alert.alert('Success', 'Form updated');
      } else {
        const nextDrop = await getNextDropNumber(selectedDelivery.dlf_code);
        await addTripLog({
          ...dropData,
          dlf_code: selectedDelivery.dlf_code,
          driver: selectedDelivery.driver,
          helper: selectedDelivery.helper,
          plate_no: selectedDelivery.plate_no,
          trip_count: selectedDelivery.trip_count,
          company_departure: companyDeparture,
          company_arrival: companyArrival,
          plant_odo_departure: plantOdoDeparture || null,
          plant_odo_arrival: plantOdoArrival || null,
          drop_number: nextDrop,
          created_by: getFormattedUserName(),
          created_at: getLocalTimestamp(),
          synced: -1,
          sync_status: 'no',
        });
        Alert.alert('Success', 'Drop logged');
      }
      
      const logs = await getTripLogsByDeliveryId(selectedDelivery.dlf_code);
      setDropLogs(logs);
      setShowDropModal(false);
      setShowPickUpModal(false);
      setEditingDrop(null);
      setEditingPickUp(null);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddExpense = () => {
    if (!selectedDelivery) {
      Alert.alert('Error', 'Please select a delivery first');
      return;
    }
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (expenseType, amount) => {
    try {
      await addExpense({
        dlf_code: selectedDelivery.dlf_code,
        expense_type: expenseType,
        amount: amount,
        created_at: getLocalTimestamp(),
      });
      
      const deliveryExpenses = await getExpensesByDeliveryId(selectedDelivery.dlf_code);
      setExpenses(deliveryExpenses);
      setShowExpenseModal(false);
      
      Alert.alert('Success', 'Expense added');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expenseId);
              
              const deliveryExpenses = await getExpensesByDeliveryId(selectedDelivery.dlf_code);
              setExpenses(deliveryExpenses);
              
              Alert.alert('Success', 'Expense deleted');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleSaveDraft = async () => {
    if (!selectedDelivery) {
      Alert.alert('Error', 'Please select a delivery');
      return;
    }
    
    try {
      const existingLogs = await getTripLogsByDeliveryId(selectedDelivery.dlf_code);
      const existingDrop0 = existingLogs.find(log => log.drop_number === 0);
      
      if (existingDrop0) {
        await updateTripLog(existingDrop0.id, {
          ...existingDrop0,
          company_departure: companyDeparture,
          company_arrival: companyArrival,
          plant_odo_departure: plantOdoDeparture || existingDrop0.plant_odo_departure || null,
          plant_odo_arrival: plantOdoArrival || existingDrop0.plant_odo_arrival || null,
        });
      } else {
        await addTripLog({
          dlf_code: selectedDelivery.dlf_code,
          driver: selectedDelivery.driver,
          helper: selectedDelivery.helper,
          plate_no: selectedDelivery.plate_no,
          trip_count: selectedDelivery.trip_count,
          company_departure: companyDeparture,
          company_arrival: companyArrival,
          plant_odo_departure: plantOdoDeparture || null,
          plant_odo_arrival: plantOdoArrival || null,
          drop_number: 0,
          customer: null,
          dds_id: null,
          address: null,
          customer_arrival: null,
          customer_departure: null,
          quantity: null,
          remarks: 'Draft - No drops logged yet',
          form_type: 'delivery',
          created_by: getFormattedUserName(),
          created_at: getLocalTimestamp(),
          synced: -1,
          sync_status: 'no',
        });
      }
      
      Alert.alert('Success', 'Delivery saved as draft!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFinalize = async () => {
    if (!selectedDelivery) {
      Alert.alert('Error', 'Please select a delivery');
      return;
    }
    
    if (!companyDeparture) {
      Alert.alert('Error', 'Please capture company departure time');
      return;
    }

    if (!companyArrival) {
      Alert.alert('Error', 'Please capture company arrival time');
      return;
    }
    
    if (dropLogs.length === 0) {
      Alert.alert('Error', 'Please log at least one customer drop');
      return;
    }
    
    const actualDrops = dropLogs.filter(log => log.drop_number > 0);
    
    if (actualDrops.length === 0) {
      Alert.alert('Error', 'Please log at least one customer drop');
      return;
    }
    
    const hasArrival = actualDrops.some(log => log.customer_arrival);
    if (!hasArrival) {
      Alert.alert('Error', 'At least one drop must have arrival time');
      return;
    }
    
    try {
      await updateCompanyTimes(selectedDelivery.dlf_code, companyDeparture, companyArrival);
      
      const allLogs = await getTripLogsByDeliveryId(selectedDelivery.dlf_code);
      for (const log of allLogs) {
        await updateTripLog(log.id, { 
          ...log,
          company_departure: companyDeparture,
          company_arrival: companyArrival,
          plant_odo_departure: plantOdoDeparture || log.plant_odo_departure || null,
          plant_odo_arrival: plantOdoArrival || log.plant_odo_arrival || null,
          synced: 0,
          sync_status: 'no'
        });
      }
      
      Alert.alert('Success', 'Delivery finalized and ready to sync!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Finalize error:', error);
      Alert.alert('Error', 'Failed to finalize: ' + error.message);
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

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

  const getLoggedCustomers = () => {
    return dropLogs
      .filter(log => log.drop_number > 0)
      .map(log => `${log.customer}|${log.delivery_address}`);
  };

  return {
    // State
    currentUser, loading, syncing, isEditMode, deliveries, showDeliveryPicker, selectedDelivery, allTrips, companyDeparture,
    companyArrival, dropLogs, showDropModal, showPickUpModal, editingPickUp, editingDrop, plantOdoDeparture, plantOdoArrival,
    expenses, showExpenseModal, expenseTypes,
    // Setters
    setShowDeliveryPicker, setShowDropModal, setShowPickUpModal, setShowExpenseModal, setPlantOdoDeparture, setPlantOdoArrival,
    // Handlers
    handleRefreshDeliveries, handleSelectDelivery, handleCaptureCompanyDeparture, handleCaptureCompanyArrival, handleAddDrop,
    handleEditDrop, handleSaveFromModal, handleAddExpense, handleSaveExpense, handleDeleteExpense, handleSaveDraft, handleFinalize,
    // Utilities
    formatTimeOnly, getLoggedCustomers,
  };
};