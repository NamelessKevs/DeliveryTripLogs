import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
  getTripLogsByDeliveryId,
  addTripLog,
  updateTripLog,
  updateCompanyTimes,
  getNextDropNumber,
  getLocalTimestamp,
} from '../database/db';
import { fetchDeliveriesFromAPI } from '../api/deliveryApi';
import CustomerDropModal from '../components/CustomerDropModal';

const DeliveryFormScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Delivery selection
  const [deliveries, setDeliveries] = useState([]);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  
  // Company times
  const [companyDeparture, setCompanyDeparture] = useState(null);
  const [companyArrival, setCompanyArrival] = useState(null);
  
  // Drop logs
  const [dropLogs, setDropLogs] = useState([]);
  
  // Customer drop modal
  const [showDropModal, setShowDropModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

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
            delivery_id: item.delivery_id,
            driver_name: item.driver,
            helper: item.helper,
            truck_plate: item.truckplateno,
            trip: item.trip,
            customers: item.dds || [],
          };
          await saveCachedDelivery(deliveryData);
        }
        
        // Reload cached deliveries
        const cached = await getCachedDeliveries();
        setDeliveries(cached);
        
        Alert.alert('Success', `Fetched ${result.data.length} deliveries`);
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
    const logs = await getTripLogsByDeliveryId(delivery.delivery_id);
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
    
    // Update all existing drops
    if (selectedDelivery && dropLogs.length > 0) {
      updateCompanyTimes(selectedDelivery.delivery_id, now, companyArrival);
    }
  };

  const handleCaptureCompanyArrival = () => {
    const now = formatDateTime(new Date());
    setCompanyArrival(now);
    
    // Update all existing drops
    if (selectedDelivery && dropLogs.length > 0) {
      updateCompanyTimes(selectedDelivery.delivery_id, companyDeparture, now);
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
        const nextDrop = await getNextDropNumber(selectedDelivery.delivery_id);
        await addTripLog({
          ...dropData,
          delivery_id: selectedDelivery.delivery_id,
          driver_name: selectedDelivery.driver_name,
          helper: selectedDelivery.helper,
          truck_plate: selectedDelivery.truck_plate,
          trip: selectedDelivery.trip,
          drop_number: nextDrop,
          company_departure: companyDeparture,
          company_arrival: companyArrival,
          created_by: getFormattedUserName(),
          created_at: getLocalTimestamp(),
          synced: -1, // Draft by default
          sync_status: 'no',
        });
        Alert.alert('Success', 'Drop logged');
      }
      
      // Reload drops
      const logs = await getTripLogsByDeliveryId(selectedDelivery.delivery_id);
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
    // Save a placeholder "draft" log for this delivery
    await addTripLog({
      delivery_id: selectedDelivery.delivery_id,
      driver_name: selectedDelivery.driver_name,
      helper: selectedDelivery.helper,
      truck_plate: selectedDelivery.truck_plate,
      trip: selectedDelivery.trip,
      drop_number: 0, // 0 = draft marker (no actual drop yet)
      company_departure: companyDeparture,
      company_arrival: companyArrival,
      customer: null,
      address: null,
      customer_arrival: null,
      customer_departure: null,
      remarks: 'Draft - No drops logged yet',
      created_by: getFormattedUserName(),
      created_at: getLocalTimestamp(),
      synced: -1, // Draft
      sync_status: 'no',
    });
    
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
    
    if (dropLogs.length === 0) {
      Alert.alert('Error', 'Please log at least one customer drop');
      return;
    }
    
    const hasArrival = dropLogs.some(log => log.customer_arrival);
    if (!hasArrival) {
      Alert.alert('Error', 'At least one drop must have arrival time');
      return;
    }
    
    // Mark all drops as ready to sync (synced = 0)
    try {
      for (const log of dropLogs) {
        await updateTripLog(log.id, { ...log, synced: 0 });
      }
      Alert.alert('Success', 'Delivery finalized and ready to sync!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to finalize');
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
          style={styles.refreshButton}
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
          style={styles.dropdownButton}
          onPress={() => setShowDeliveryPicker(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedDelivery ? selectedDelivery.delivery_id : 'Select delivery...'}
          </Text>
        </TouchableOpacity>

        {selectedDelivery && (
          <>
            {/* Auto-filled fields */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Driver:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.driver_name}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Helper:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.helper || 'N/A'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Truck:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.truck_plate}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Trip:</Text>
              <Text style={styles.infoValue}>{selectedDelivery.trip}</Text>
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
              {dropLogs.map((log, idx) => (
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
              keyExtractor={(item) => item.delivery_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deliveryItem}
                  onPress={() => handleSelectDelivery(item)}
                >
                  <Text style={styles.deliveryItemText}>{item.delivery_id}</Text>
                  <Text style={styles.deliveryItemSubtext}>{item.driver_name}</Text>
                </TouchableOpacity>
              )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  refreshButton: {
    backgroundColor: '#1FCFFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
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