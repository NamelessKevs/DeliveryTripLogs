import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, FlatList} from 'react-native';
import {getCurrentUser, getCachedDeliveries, saveCachedDelivery, getCachedDeliveryById, getTripLogsByDeliveryId, addTripLog, updateTripLog, 
updateCompanyTimes, getNextDropNumber, getLocalTimestamp, getAllTripLogs, addExpense, getExpensesByDeliveryId, deleteExpense, getCachedExpenseTypes, saveCachedExpenseTypes} from '../database/db';
import { fetchDeliveriesFromAPI } from '../api/deliveryApi';
import CustomerDropModal from '../components/CustomerDropModal';
import ExpenseModal from '../components/ExpenseModal';
import PickUpFormModal from '../components/PickUpFormModal';
import { styles, Colors } from '../styles/styles';

const DeliveryFormScreen = ({ navigation, route }) => {
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
    
    // Check if editing existing delivery
    if (route.params?.deliveryToEdit) {
      setIsEditMode(true);
      const draft = route.params.deliveryToEdit;
      
      // Load delivery from cache to get customers
      getCachedDeliveryById(draft.dlf_code).then(cachedDelivery => {
        if (cachedDelivery) {
          handleSelectDelivery(cachedDelivery);
        } else {
          // Fallback if not in cache
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
      
      // Load cached deliveries
      const cached = await getCachedDeliveries();
      setDeliveries(cached);

      const types = await getCachedExpenseTypes();
      setExpenseTypes(types);
      
      // Load all trips to check used dlf_codes
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
        // Save to cache
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
        
        // Reload cached deliveries
        const cached = await getCachedDeliveries();
        setDeliveries(cached);

        // Save expense types to cache if available
        if (result.expense_types && result.expense_types.length > 0) {
          await saveCachedExpenseTypes(result.expense_types);
          setExpenseTypes(result.expense_types);
        }
        
        Alert.alert('Success', `Fetched ${cached.length} deliveries`);
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
    
    // Load existing drop logs for this delivery
    const logs = await getTripLogsByDeliveryId(delivery.dlf_code);
    setDropLogs(logs);

    const deliveryExpenses = await getExpensesByDeliveryId(delivery.dlf_code);
    setExpenses(deliveryExpenses);
    
    // Load company times from first log if exists
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
    
    // Update all existing drops
    if (selectedDelivery && dropLogs.length > 0) {
      updateCompanyTimes(selectedDelivery.dlf_code, now, companyArrival);
    }
  };

  const handleCaptureCompanyArrival = () => {
    // Validate departure was captured first
    if (!companyDeparture) {
      Alert.alert('Warning', 'Please capture company departure time first');
      return;
    }

    const now = formatDateTime(new Date());
    setCompanyArrival(now);
    
    // Update all existing drops
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

      if (isEditing) {  // ✅ Check BOTH editingDrop OR editingPickUp
        // Update existing drop/pick-up
        const logToUpdate = editingDrop || editingPickUp;
        await updateTripLog(logToUpdate.id, dropData);
        Alert.alert('Success', 'Form updated');
      } else {
        // Add new drop
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
      
      // Reload drops
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
    
    // Reload expenses
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
            
            // Reload expenses
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
  
  // if (!companyDeparture) {
  //   Alert.alert('Error', 'Please capture company departure time');
  //   return;
  // }
  
  try {
    // Check if drop 0 already exists for this delivery
    const existingLogs = await getTripLogsByDeliveryId(selectedDelivery.dlf_code);
    const existingDrop0 = existingLogs.find(log => log.drop_number === 0);
    
    if (existingDrop0) {
      // Update existing drop 0
      await updateTripLog(existingDrop0.id, {
        ...existingDrop0,
        company_departure: companyDeparture,
        company_arrival: companyArrival,
        plant_odo_departure: plantOdoDeparture || existingDrop0.plant_odo_departure || null,
        plant_odo_arrival: plantOdoArrival || existingDrop0.plant_odo_arrival || null,
      });
    } else {
      // Create new drop 0
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
    
    // Filter out drop_number 0 (draft placeholder)
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
      // Update company times for ALL drops (including placeholder)
      await updateCompanyTimes(selectedDelivery.dlf_code, companyDeparture, companyArrival);
      
      // Mark all drops as ready to sync (synced = 0)
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
      .filter(log => log.drop_number > 0) // Exclude drop 0
      .map(log => `${log.customer}|${log.delivery_address}`);
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
        {/* Refresh Button */}
        <View style={styles.inputRow}>
          {/* Delivery Dropdown */}
          <TouchableOpacity
            style={[styles.dropdownButton, isEditMode && styles.dropdownDisabled]}
            onPress={() => !isEditMode && setShowDeliveryPicker(true)}
            disabled={isEditMode}
          >
            <Text style={styles.dropdownText}>
              {selectedDelivery ? selectedDelivery.dlf_code : 'Select DLF Code...'}
            </Text>
          </TouchableOpacity>
                    <TouchableOpacity
            style={[styles.deliveryFormRefreshButton, isEditMode && styles.deliveryFormEditModeButton]}
            onPress={handleRefreshDeliveries}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deliveryFormRefreshButtonText}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>

        {selectedDelivery && (
          <>
            {/* Auto-filled fields */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Driver:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.driver}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Helper:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.helper || 'N/A'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Truck:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.plate_no}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Trip:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.trip_count}</Text>
            </View>

            {/* Company Times */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Time Logs</Text>
              <TouchableOpacity
                style={styles.deliveryFormCaptureButton}
                onPress={handleCaptureCompanyDeparture}
              >
                <Text style={styles.deliveryFormCaptureButtonText}>
                  Departure: {formatTimeOnly(companyDeparture)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deliveryFormCaptureButton}
                onPress={handleCaptureCompanyArrival}
              >
                <Text style={styles.deliveryFormCaptureButtonText}>
                  Arrival: {formatTimeOnly(companyArrival)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expenses Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              
              {/* Expense List */}
              {expenses.length > 0 && (
                <View style={{ marginBottom: 15 }}>
                  {expenses.map((expense, idx) => (
                    <View key={idx} style={styles.deliveryFormExpenseCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryFormExpenseType}>{expense.type}</Text>
                        <Text style={styles.deliveryFormExpenseAmount}>₱{expense.amount}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deliveryFormDeleteExpenseButton}
                        onPress={() => handleDeleteExpense(expense.id)}
                      >
                        <Text style={styles.deliveryFormDeleteExpenseButtonText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Add Expense Button */}
              <TouchableOpacity
                style={styles.deliveryFormAddExpenseButton}
                onPress={handleAddExpense}
              >
                <Text style={styles.deliveryFormAddExpenseButtonText}>+ Add Expense</Text>
              </TouchableOpacity>
            </View>

            {/* Plant Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Odometer Reaadings</Text>
              <Text style={styles.label}>Odometer Departure</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 125400"
                keyboardType="number-pad"
                value={plantOdoDeparture}
                onChangeText={setPlantOdoDeparture}
              />
              <Text style={styles.label}>Odometer Arrival</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 125650"
                keyboardType="number-pad"
                value={plantOdoArrival}
                onChangeText={setPlantOdoArrival}
              />
            </View>

            {/* Customer Checklist */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                No of Drop(s): ({selectedDelivery.customers.length})
              </Text>
              {selectedDelivery.customers.map((customer, idx) => {
                const uniqueKey = `${customer.customer_name}|${customer.delivery_address}`;
                const isLogged = getLoggedCustomers().includes(uniqueKey);
                
                return (
                  <View key={idx} style={styles.deliveryFormChecklistItem}>
                    <View style={{flex: 1}}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.deliveryFormCheckbox}>{isLogged ? '☑' : '☐'}</Text>
                        <Text style={styles.deliveryFormChecklistText}>{customer.customer_name}</Text>
                      </View>
                      {customer.delivery_address && (
                        <Text style={styles.deliveryFormDeliveryAddressText}>
                          📍 {customer.delivery_address}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Drop Logs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Drop Logs</Text>
              {dropLogs.filter(log => log.drop_number > 0).map((log, idx) => (
                <View key={log.id} style={styles.deliveryFormDropLogCard}>
                  <Text style={styles.deliveryFormDropTitle}>
                    Drop {log.drop_number}: ✅ {log.customer}
                  </Text>
                  <Text style={styles.deliveryFormDropTime}>
                    🕐 {formatTimeOnly(log.customer_arrival)} - {formatTimeOnly(log.customer_departure)}
                  </Text>
                  <TouchableOpacity
                    style={styles.deliveryFormEditButton}
                    onPress={() => handleEditDrop(log)}
                  >
                    <Text style={styles.deliveryFormEditButtonText}>EDIT</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add Drop Button */}
            <TouchableOpacity
              style={styles.deliveryFormAddDropButton}
              onPress={handleAddDrop}
            >
              <Text style={styles.deliveryFormAddDropButtonText}>+ Log Customer Drop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deliveryFormAddDropButton, {backgroundColor: '#FF9500'}]}
              onPress={() => setShowPickUpModal(true)}
            >
              <Text style={styles.deliveryFormAddDropButtonText}>+ Log Pick-Up</Text>
            </TouchableOpacity>

            {/* Draft / Finalize Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.deliveryFormDraftButton} onPress={handleSaveDraft}>
                <Text style={styles.buttonText}>💾 Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deliveryFormFinalizeButton} onPress={handleFinalize}>
                <Text style={styles.buttonText}>✅ Finalize</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Delivery Picker Modal */}
      <Modal visible={showDeliveryPicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Delivery</Text>
            <FlatList
              data={deliveries}
              keyExtractor={(item) => item.dlf_code}
              renderItem={({ item }) => {
                const hasLogs = allTrips.some(t => t.dlf_code === item.dlf_code);
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.deliveryFormDeliveryItem,
                      hasLogs && styles.deliveryFormDeliveryItemUsed
                    ]}
                    onPress={() => !hasLogs && handleSelectDelivery(item)}
                    disabled={hasLogs}
                  >
                    <Text style={[styles.deliveryFormDeliveryItemText, hasLogs && styles.deliveryFormDeliveryItemTextDisabled]}>
                      {item.dlf_code}
                      {hasLogs && <Text style={styles.deliveryFormUsedBadge}> ✓ Already logged</Text>}
                    </Text>
                    <Text style={styles.deliveryFormDeliveryItemSubtext}>{item.driver}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.deliveryFormModalCloseButton}
              onPress={() => setShowDeliveryPicker(false)}
            >
              <Text style={styles.deliveryFormModalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Customer Drop Modal - Placeholder for Step 4 */}
      {showDropModal && (
        <CustomerDropModal
        visible={showDropModal}
        delivery={selectedDelivery}
        editingDrop={editingDrop}
        loggedCustomers={getLoggedCustomers()}
        onSave={handleSaveFromModal}
        onCancel={() => setShowDropModal(false)}
        />
      )}
      {/* Pick-up Modal */}
      {showPickUpModal && (
        <PickUpFormModal
          visible={showPickUpModal}
          editingPickUp={editingPickUp}
          onSave={handleSaveFromModal}
          onCancel={() => {
            setShowPickUpModal(false);
            setEditingPickUp(null);
          }}
        />
      )}
      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          visible={showExpenseModal}
          expenseTypes={expenseTypes}
          onSave={handleSaveExpense}
          onCancel={() => setShowExpenseModal(false)}
        />
      )}
    </View>
  );
};

export default DeliveryFormScreen;