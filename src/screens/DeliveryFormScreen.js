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
  FlatList,
} from 'react-native';
import { 
  getCurrentUser, 
  getCachedDeliveries, 
  saveCachedDelivery,
  getCachedDeliveryById,
  getTripLogsByDeliveryId,
  addTripLog,
  updateTripLog,
  updateCompanyTimes,
  getNextDropNumber,
  getLocalTimestamp,
  getAllTripLogs
} from '../database/db';
import { fetchDeliveriesFromAPI } from '../api/deliveryApi';
import CustomerDropModal from '../components/CustomerDropModal';

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
  const [editingDrop, setEditingDrop] = useState(null);

  const [plantRunHours, setPlantRunHours] = useState('');
  const [plantOdoDeparture, setPlantOdoDeparture] = useState('');
  const [plantOdoArrival, setPlantOdoArrival] = useState('');
  const [plantKmsRun, setPlantKmsRun] = useState('');

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
      setPlantRunHours(draft.plant_run_hours || '');
      setPlantOdoDeparture(draft.plant_odo_departure || '');
      setPlantOdoArrival(draft.plant_odo_arrival || '');
      setPlantKmsRun(draft.plant_kms_run || '');
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

    // Auto-calculate plant_run_hours
    if (companyDeparture) {
      const depTime = new Date(companyDeparture);
      const arrTime = new Date(now);
      const diffMs = arrTime - depTime;
      const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2); // Convert to hours with 2 decimals
      setPlantRunHours(diffHours >= 0 ? diffHours : '0');
    }
    
    // Update all existing drops
    if (selectedDelivery && dropLogs.length > 0) {
      updateCompanyTimes(selectedDelivery.dlf_code, now, companyArrival);
    }
  };

  const handleCaptureCompanyArrival = () => {
    const now = formatDateTime(new Date());
    setCompanyArrival(now);
    
    // Auto-calculate plant_run_hours
    if (companyDeparture) {
      const depTime = new Date(companyDeparture);
      const arrTime = new Date(now);
      const diffMs = arrTime - depTime;
      const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
      setPlantRunHours(diffHours >= 0 ? diffHours : '0');
    }
    
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
    setEditingDrop(drop);
    setShowDropModal(true);
  };

  const handleSaveFromModal = async (dropData) => {
    try {
      if (editingDrop) {
        // Update existing drop
        await updateTripLog(editingDrop.id, dropData);
        Alert.alert('Success', 'Drop updated');
      } else {
        // Add new drop
        const nextDrop = await getNextDropNumber(selectedDelivery.dlf_code);
        const calculatedRunHours = calculateRunHours(companyDeparture, companyArrival);
        await addTripLog({
          ...dropData,
          dlf_code: selectedDelivery.dlf_code,
          driver: selectedDelivery.driver,
          helper: selectedDelivery.helper,
          plate_no: selectedDelivery.plate_no,
          trip_count: selectedDelivery.trip_count,
          company_departure: companyDeparture,
          company_arrival: companyArrival,
          plant_run_hours: calculatedRunHours || plantRunHours,
          plant_odo_departure: plantOdoDeparture,
          plant_odo_arrival: plantOdoArrival,
          plant_kms_run: plantKmsRun,
          drop_number: nextDrop,
          created_by: getFormattedUserName(),
          created_at: getLocalTimestamp(),
          synced: -1, // Draft by default
          sync_status: 'no',
        });
        Alert.alert('Success', 'Drop logged');
      }
      
      // Reload drops
      const logs = await getTripLogsByDeliveryId(selectedDelivery.dlf_code);
      setDropLogs(logs);
      setShowDropModal(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

const handleSaveDraft = async () => {
  if (!selectedDelivery) {
    Alert.alert('Error', 'Please select a delivery');
    return;
  }
  
  if (!companyDeparture) {
    Alert.alert('Error', 'Please capture company departure time');
    return;
  }
  
  try {
    // Check if drop 0 already exists for this delivery
    const existingLogs = await getTripLogsByDeliveryId(selectedDelivery.dlf_code);
    const existingDrop0 = existingLogs.find(log => log.drop_number === 0);
    const calculatedRunHours = calculateRunHours(companyDeparture, companyArrival);
    
    if (existingDrop0) {
      // Update existing drop 0
      await updateTripLog(existingDrop0.id, {
        ...existingDrop0,
        company_departure: companyDeparture,
        company_arrival: companyArrival,
        plant_run_hours: calculatedRunHours || plantRunHours, // Use calculated or manual
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
        plant_run_hours: calculatedRunHours || plantRunHours,
        plant_odo_departure: plantOdoDeparture,
        plant_odo_arrival: plantOdoArrival,
        plant_kms_run: plantKmsRun,
        drop_number: 0,
        customer: null,
        address: null,
        customer_arrival: null,
        customer_departure: null,
        remarks: 'Draft - No drops logged yet',
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
      const calculatedRunHours = calculateRunHours(companyDeparture, companyArrival);
      for (const log of allLogs) {
        await updateTripLog(log.id, { 
          ...log,
          company_departure: companyDeparture,
          company_arrival: companyArrival,
          plant_run_hours: calculatedRunHours || log.plant_run_hours,
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

  const calculateRunHours = (departure, arrival) => {
    if (!departure || !arrival) return null;
    try {
      const depTime = new Date(departure);
      const arrTime = new Date(arrival);
      const diffMs = arrTime - depTime;
      const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
      return diffHours >= 0 ? diffHours : null;
    } catch {
      return null;
    }
  };

  const getLoggedCustomers = () => {
    return dropLogs.map(log => log.customer);
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
        <TouchableOpacity
          style={[styles.refreshButton, isEditMode && styles.editModeButton]}
          onPress={handleRefreshDeliveries}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.refreshButtonText}>🔄 Refresh Deliveries</Text>
          )}
        </TouchableOpacity>

        {/* Delivery Dropdown */}
        <Text style={styles.label}>Delivery</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, isEditMode && styles.dropdownDisabled]}
          onPress={() => !isEditMode && setShowDeliveryPicker(true)}
          disabled={isEditMode}
        >
          <Text style={styles.dropdownText}>
            {selectedDelivery ? selectedDelivery.dlf_code : 'Select delivery...'}
          </Text>
        </TouchableOpacity>

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
              <Text style={styles.sectionTitle}>Company Times</Text>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCaptureCompanyDeparture}
              >
                <Text style={styles.captureButtonText}>
                  Departure: {formatTimeOnly(companyDeparture)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCaptureCompanyArrival}
              >
                <Text style={styles.captureButtonText}>
                  Arrival: {formatTimeOnly(companyArrival)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Plant Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plant Metrics</Text>
              
              <Text style={styles.label}>Run Hours (auto-calculated)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                placeholder="Auto-calculated from company times"
                value={plantRunHours}
                editable={false}
              />

              <Text style={styles.label}>Odometer Departure (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 125400"
                keyboardType="number-pad"
                value={plantOdoDeparture}
                onChangeText={(value) => {
                  setPlantOdoDeparture(value);
                  // Auto-calculate kms_run if both values exist
                  if (plantOdoArrival && value) {
                    const kms = parseFloat(plantOdoArrival) - parseFloat(value);
                    setPlantKmsRun(kms >= 0 ? kms.toFixed(1) : '');
                  }
                }}
              />

              <Text style={styles.label}>Odometer Arrival (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 125650"
                keyboardType="number-pad"
                value={plantOdoArrival}
                onChangeText={(value) => {
                  setPlantOdoArrival(value);
                  // Auto-calculate kms_run
                  if (plantOdoDeparture && value) {
                    const kms = parseFloat(value) - parseFloat(plantOdoDeparture);
                    setPlantKmsRun(kms >= 0 ? kms.toFixed(1) : '');
                  }
                }}
              />

              <Text style={styles.label}>Kilometers Run (auto-calculated)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                placeholder="Auto-calculated"
                value={plantKmsRun}
                editable={false}
              />
            </View>

            {/* Customer Checklist */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                No of CUSTOMERS: ({selectedDelivery.customers.length})
              </Text>
              {selectedDelivery.customers.map((customer, idx) => {
                const isLogged = getLoggedCustomers().includes(customer.customer_name);
                return (
                  <View key={idx} style={styles.checklistItem}>
                    <Text style={styles.checkbox}>{isLogged ? '☑' : '☐'}</Text>
                    <Text style={styles.checklistText}>{customer.customer_name}</Text>
                  </View>
                );
              })}
            </View>

            {/* Drop Logs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Drop Logs</Text>
              {dropLogs.filter(log => log.drop_number > 0).map((log, idx) => (
                <View key={log.id} style={styles.dropLogCard}>
                  <Text style={styles.dropTitle}>
                    Drop {log.drop_number}: ✅ {log.customer}
                  </Text>
                  <Text style={styles.dropTime}>
                    🕐 {formatTimeOnly(log.customer_arrival)} - {formatTimeOnly(log.customer_departure)}
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditDrop(log)}
                  >
                    <Text style={styles.editButtonText}>EDIT</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add Drop Button */}
            <TouchableOpacity
              style={styles.addDropButton}
              onPress={handleAddDrop}
            >
              <Text style={styles.addDropButtonText}>+ Log Next Customer Drop</Text>
            </TouchableOpacity>

            {/* Draft / Finalize Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
                <Text style={styles.buttonText}>💾 Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.finalizeButton} onPress={handleFinalize}>
                <Text style={styles.buttonText}>✅ Finalize</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Delivery Picker Modal */}
      <Modal visible={showDeliveryPicker} animationType="slide" transparent>
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
                      styles.deliveryItem,
                      hasLogs && styles.deliveryItemUsed
                    ]}
                    onPress={() => !hasLogs && handleSelectDelivery(item)}
                    disabled={hasLogs}
                  >
                    <Text style={[styles.deliveryItemText, hasLogs && styles.deliveryItemTextDisabled]}>
                      {item.dlf_code}
                      {hasLogs && <Text style={styles.usedBadge}> ✓ Already logged</Text>}
                    </Text>
                    <Text style={styles.deliveryItemSubtext}>{item.driver}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDeliveryPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  editModeButton: {
    display: 'none',
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
  dropdownDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  refreshButton: {
    backgroundColor: '#1FCFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  deliveryItemUsed: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  deliveryItemTextDisabled: {
    color: '#999',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usedBadge: {
    color: '#10dc17ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  captureButton: {
    backgroundColor: '#1FCFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    fontSize: 20,
    marginRight: 10,
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
  },
  dropLogCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  dropTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#1FCFFF',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addDropButton: {
    backgroundColor: '#10dc17ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addDropButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#504f4fff',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  deliveryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  deliveryItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deliveryItemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalCloseButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeliveryFormScreen;